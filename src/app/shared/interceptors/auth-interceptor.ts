import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@shared/services/auth';
import { switchMap, throwError, catchError, of } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const token = authService.getToken();

  let authReq = req;
  
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError(err => {
      // Handle 401 and refresh
      if (err.status === 401) {
        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) {
          authService.logout();
          return throwError(() => err);
        }

        // Refresh the token
        return authService.refreshToken().pipe(
          switchMap(newTokenResponse => {
            const newToken = newTokenResponse.token;

            // Retry original request with new token
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });

            return next(retryReq);
          }),
          catchError(innerErr => {
            // If refresh fails → logout
            authService.logout();
            return throwError(() => innerErr);
          })
        );
      }

      return throwError(() => err);
    })
  );
};
