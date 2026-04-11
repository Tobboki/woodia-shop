import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { LanguageService } from '@woodia-core/services/language.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const langService = inject(LanguageService);

  const token = authService.getToken();
  const locale = langService.locale();

  // Only attach the token for our API requests, exclude external URLs like google accounts
  const isExternalUrl = req.url.startsWith('http') && !req.url.includes('woodia.onrender.com') && !req.url.includes('localhost:4200');

  let setHeaders: any = {
    'Accept-Language': locale,
  };

  if (token && !isExternalUrl) {
    setHeaders['Authorization'] = `Bearer ${token}`;
  }

  let cloned = req.clone({ setHeaders });

  return next(cloned).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse) {
        switch (err.status) {
          case 401:
            // Attempt refresh
            const refreshToken = authService.getRefreshToken();
            if (!refreshToken) {
              authService.logout();
              console.log("interceptor 401 error", err)
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

          case 403:
            // Optional: navigate to forbidden page / show toast
            console.warn('Forbidden request');
            break;

          case 500:
            console.error('Server error', err);
            break;

          default:
            console.error('HTTP error', err);
        }
      }

      return throwError(() => err);
    })
  );
};
