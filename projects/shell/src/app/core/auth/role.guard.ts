import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const requiredRoles = route.data['roles'] as Array<string>;

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  await authService.waitForCurrentUser();

  const normalizedRequiredRoles = requiredRoles.map((role) => role.toLowerCase());
  const userRoles = authService.getEffectiveUserRoles();
  const hasRole = normalizedRequiredRoles.some((requiredRole) => userRoles.includes(requiredRole));

  if (hasRole) {
    return true;
  }

  console.warn(
    `[RoleGuard] Access denied. Required roles: ${requiredRoles.join(', ')}. User roles: ${userRoles.join(', ') || 'none'}`,
  );
  router.navigate(['/forbidden']).then();
  return false;
};
