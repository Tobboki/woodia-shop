import { inject } from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  // Bypass for Google OAuth landing
  if (window.location.hash.includes('id_token=') || window.location.hash.includes('access_token=')) {
    return true;
  }

  const user = authService.getCurrentUser();
  if (authService.isAuthenticated()) {
    if (user?.userType === 'Client' && !state.url.startsWith('/customers')) {
      return router.parseUrl('/customers');
    }
    // Add similar logic for MAKER
  }

  return !authService.isAuthenticated();
};
