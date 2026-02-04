import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const oauthService = inject(OAuthService);

  const requiredRoles = route.data['roles'] as Array<string>;

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (!oauthService.hasValidAccessToken()) {
    oauthService.initCodeFlow();
    return false;
  }

  const claims = oauthService.getIdentityClaims() as any;
  const userRoles = claims?.realm_access?.roles || [];
  const hasRole = requiredRoles.some((role) => userRoles.includes(role));

  if (hasRole) {
    return true;
  }

  router.navigate(['/forbidden']);
  return false;
};
