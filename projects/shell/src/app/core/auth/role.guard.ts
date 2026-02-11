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

  let userRoles: string[] = [];
  try {
    const token = oauthService.getAccessToken();
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userRoles = payload?.realm_access?.roles || [];
    }
  } catch (e) {
    console.error('Lỗi decode token:', e);
  }

  const hasRole = requiredRoles.some(
    (requiredRole) =>
      userRoles.includes(requiredRole) || userRoles.includes(requiredRole.toLowerCase()),
  );

  if (hasRole) {
    return true;
  }

  router.navigate(['/forbidden']);
  return false;
};
