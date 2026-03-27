import { AuthConfig } from "angular-oauth2-oidc";
import { environment } from "../../../environments/environment";

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  redirectUri: window.location.origin + '/auth/google-callback',
  clientId: environment.googleSignInClientId,
  strictDiscoveryDocumentValidation: false,
  scope: 'openid profile email',
  customQueryParams: {
    prompt: 'select_account',
  },
  responseType: 'id_token token',
  useSilentRefresh: false,
  showDebugInformation: true,
}
