import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();

  // Don't redirect if already heading to the right place
  if (isAuthenticated) {
    if (user?.userType === 'MAKER') {
      if (state.url.startsWith('/makers')) return true; // ← already there, let through
      return router.parseUrl('/makers/jobs');
    }
    if (user?.userType === 'CLIENT') {
      if (state.url.startsWith('/customers')) return true; // ← already there, let through
      return router.parseUrl('/customers/jobs');
    }
  }

  return true;
};

export const customerGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
  }

  const user = auth.getCurrentUser();

  if (user?.userType !== 'CLIENT') {
    // Makers go to their own area, others to home
    if (user?.userType === 'MAKER') return router.createUrlTree(['/makers/jobs']);
    return router.createUrlTree(['/home']);
  }

  return true;
};

export const makerGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
  }

  const user = auth.getCurrentUser();

  if (user?.userType !== 'MAKER') {
    // Clients go to their own area, others to home
    if (user?.userType === 'CLIENT') return router.createUrlTree(['/customers/jobs']);
    return router.createUrlTree(['/home']);
  }

  const isComplete = user?.isProfileComplete;
  const goingToOnboarding = state.url.startsWith('/makers/onboarding');

  // Break the loop: only redirect if NOT already going to onboarding
  if (!isComplete && !goingToOnboarding) {
    return router.createUrlTree(['/makers/onboarding']);
  }

  // Prevent completed makers from revisiting onboarding
  if (isComplete && goingToOnboarding) {
    return router.createUrlTree(['/makers/jobs']);
  }

  return true;
};