import { AuthConfig } from "angular-oauth2-oidc";

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  redirectUri: window.location.origin,
  clientId: process.env["NG_APP_GOOGLE_SIGN_IN_CLIENT_ID"],
  strictDiscoveryDocumentValidation: false,
  scope: 'openid profile email',
  responseType: 'code',
  useSilentRefresh: false,
}