import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';

export const googleAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const oauthService = inject(OAuthService);
  
  // Also check if url has hash with id_token or error from google
  const hash = window.location.hash;
  const search = window.location.search;
  
  const hasAuthParams = hash.includes('id_token=') || 
                        hash.includes('access_token=') || 
                        hash.includes('error=') || 
                        hash.includes('state=') || 
                        search.includes('error=') || 
                        search.includes('state=');
  
  // We allow access if Google actually returned auth tokens/errors in the URL,
  // or if the OAuth library has already processed the token into memory.
  if (hasAuthParams || oauthService.hasValidIdToken()) {
    return true;
  }
  
  // Otherwise, block access (e.g. manual URL navigation) and send them back to login
  return router.createUrlTree(['/auth/login']);
};
