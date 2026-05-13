import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'http://localhost:8088/realms/myRealm',
  redirectUri: window.location.origin,
  clientId: 'iact-web',

  responseType: 'code',

  scope: 'openid profile email offline_access',

  requireHttps: false,
  showDebugInformation: true,

  strictDiscoveryDocumentValidation: false,
};
