import { inject } from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Bypass for Google OAuth landing
  if (window.location.hash.includes('id_token=') || window.location.hash.includes('access_token=')) {
    return true;
  }

  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();

  // If user is already logged in and trying to access auth pages, redirect to their dashboard
  if (isAuthenticated && state.url.startsWith('/auth')) {
    if (user?.userType === 'Client') {
      return router.parseUrl('/customers/jobs');
    }
    if (user?.userType === 'MAKER') {
      return router.parseUrl('/makers/dashboard');
    }
    return router.parseUrl('/home');
  }

  return true;
};

