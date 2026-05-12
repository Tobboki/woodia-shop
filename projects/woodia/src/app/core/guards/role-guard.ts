import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MakerService } from '../services/maker.service';
import { map } from 'rxjs';


export const customerGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.getCurrentUser();
  if (auth.isAuthenticated() && user?.userType === 'Client') {
    return true;
  }

  return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};

export const makerGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const makerService = inject(MakerService);
  const router = inject(Router);

  const user = auth.getCurrentUser();
  if (auth.isAuthenticated() && user?.userType === 'MAKER') {
    // If user is trying to access onboarding, let them
    if (state.url.includes('/makers/onboarding')) {
      return true;
    }

    // Otherwise check if profile is completed
    return makerService.isProfileCompleted().pipe(
      map(isComplete => {
        if (isComplete) {
          return true;
        }
        return router.createUrlTree(['/makers/onboarding']);
      })
    );
  }

  return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};


