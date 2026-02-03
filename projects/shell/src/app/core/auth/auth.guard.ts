import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';

export const authGuard: CanActivateFn = (route, state) => {
  const oauthService = inject(OAuthService);

  if (oauthService.hasValidAccessToken()) {
    return true;
  }

  if (route.queryParams['code'] && route.queryParams['state']) {
    return true;
  }
  oauthService.initCodeFlow();
  return false;
};
