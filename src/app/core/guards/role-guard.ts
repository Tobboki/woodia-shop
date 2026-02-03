import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@shared/services/auth';


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
