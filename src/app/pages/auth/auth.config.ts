import { AuthConfig } from "angular-oauth2-oidc";
import { environment } from "src/environments/environment";

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  redirectUri: window.location.origin,
  clientId: environment.googleSignInClientId,
  strictDiscoveryDocumentValidation: false,
  scope: 'openid profile email',
  responseType: 'code',
  useSilentRefresh: false,
}