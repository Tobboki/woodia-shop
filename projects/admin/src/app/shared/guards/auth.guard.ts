import { inject } from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import { AuthService } from '@admin-core/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();
  const isAuth = authService.isAuthenticated();

  // Not logged in → go to login
  if (!isAuth) {
    return router.parseUrl('auth/login');
  }

  // Logged in but NOT admin → block or redirect
  if (isAuth && user?.userType !== 'admin') {
    return router.parseUrl('home'); // or '/not-authorized'
  }

  return false;
};
