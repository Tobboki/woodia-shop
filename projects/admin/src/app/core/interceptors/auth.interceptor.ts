import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  const token = authService.getToken();
  // Get language from localStorage and map to locale to avoid circular dependency with Transloco
  const lang = localStorage.getItem('language') || 'en';
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';

  // Only attach the token for our API requests
  const isApiUrl = req.url.includes('woodia.onrender.com') || req.url.includes('localhost:5033');
  const isRefreshRequest = req.url.toLowerCase().includes('refresh');
  
  let setHeaders: any = {
    'Accept-Language': locale,
  };

  // Add Authorization header only if we have a token, it's our API, and it's NOT a refresh request
  if (token && isApiUrl && !isRefreshRequest) {
    setHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Proactive refresh: if token exists but is about to expire, refresh it before sending the request
  if (token && isApiUrl && !isRefreshRequest && authService.isAccessTokenExpired()) {
    return authService.refreshToken().pipe(
      switchMap(newTokenRes => {
        const proactiveCloned = req.clone({
          setHeaders: {
            ...setHeaders,
            Authorization: `Bearer ${newTokenRes.token}`
          }
        });
        return next(proactiveCloned);
      }),
      catchError(err => {
        authService.logout();
        return throwError(() => err);
      })
    );
  }

  let cloned = req.clone({ setHeaders });

  return next(cloned).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        // If the refresh request itself fails with 401, logout
        if (isRefreshRequest) {
          authService.logout();
          return throwError(() => err);
        }

        // Attempt refresh
        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) {
          authService.logout();
          return throwError(() => err);
        }

        return authService.refreshToken().pipe(
          switchMap(newTokenRes => {
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newTokenRes.token}`,
                'Accept-Language': locale,
              },
            });
            return next(retryReq);
          }),
          catchError(innerErr => {
            authService.logout();
            return throwError(() => innerErr);
          })
        );
      }

      return throwError(() => err);
    })
  );
};
