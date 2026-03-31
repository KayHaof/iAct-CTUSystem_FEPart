import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const requiredRoles = route.data['roles'] as Array<string>;

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const userRoles = authService.getUserRoles();

  const hasRole = requiredRoles.some(
    (requiredRole) =>
      userRoles.includes(requiredRole) || userRoles.includes(requiredRole.toLowerCase()),
  );

  if (hasRole) {
    return true;
  }

  router.navigate(['/forbidden']).then();
  return false;
};
