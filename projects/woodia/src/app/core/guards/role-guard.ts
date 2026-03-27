import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


export const customerGuard: CanActivateFn = (route, state) => {

  const auth = inject(AuthService);

  if (auth.getCurrentUser()?.userType === 'Client') {
    return true;
  }

  return false;
};

export const makerGuard: CanActivateFn = (route, state) => {

  const auth = inject(AuthService);

  if (auth.getCurrentUser()?.userType === 'MAKER') {
    return true;
  }

  return false;
};
