import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '@shared/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {

  const auth = inject(AuthService);

  // Bypass for Google OAuth landing
  if (window.location.hash.includes('id_token=') || window.location.hash.includes('access_token=')) {
    return true;
  }

  if (!auth.isAuthenticated())
    return true;

  return false;
};