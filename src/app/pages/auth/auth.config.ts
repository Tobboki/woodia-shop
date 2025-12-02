import { AuthConfig } from "angular-oauth2-oidc";
import { environment } from "src/environments/environment.development";

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  redirectUri: window.location.origin,
  clientId: environment.endpoints.googleSignInClientId,
  strictDiscoveryDocumentValidation: false,
  scope: 'openid profile email',
  responseType: 'code',
  useSilentRefresh: false,
}