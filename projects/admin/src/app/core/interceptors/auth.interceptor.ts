import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, finalize } from 'rxjs';

// Flag and subject to handle concurrent 401 requests
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

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
  // (Sending an expired Bearer token with a refresh request can cause some APIs to return 401 prematurely)
  if (token && isApiUrl && !isRefreshRequest) {
    setHeaders['Authorization'] = `Bearer ${token}`;
  }

  let cloned = req.clone({ setHeaders });

  return next(cloned).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        // If the refresh request itself fails with 401, logout
        if (isRefreshRequest) {
          console.error('Refresh token expired or invalid, logging out.');
          authService.logout();
          return throwError(() => err);
        }

        // Handle normal requests failing with 401
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          const refreshToken = authService.getRefreshToken();
          console.log('Tokens for refresh:', {
            token: token,
            refreshToken: refreshToken
          });
          
          if (!refreshToken) {
            console.warn('No refresh token found in storage.');
            authService.logout();
            isRefreshing = false;
            return throwError(() => err);
          }

          console.log('Token expired, attempting refresh...');
          return authService.refreshToken().pipe(
            switchMap(newTokenRes => {
              console.log('Token refreshed successfully.');
              isRefreshing = false;
              refreshTokenSubject.next(newTokenRes.token);
              
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newTokenRes.token}`,
                  'Accept-Language': locale,
                },
              });
              return next(retryReq);
            }),
            catchError(innerErr => {
              isRefreshing = false;
              console.error('Token refresh failed, logging out.');
              authService.logout();
              return throwError(() => innerErr);
            })
          );
        } else {
          // If already refreshing, wait for the new token
          console.log('Refresh already in progress, queuing request...');
          return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(newToken => {
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                  'Accept-Language': locale,
                },
              });
              return next(retryReq);
            })
          );
        }
      }

      // Re-throw other errors
      return throwError(() => err);
    })
  );
};
