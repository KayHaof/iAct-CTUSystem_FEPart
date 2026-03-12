import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '@my-mfe/auth';

export const roleGuard: CanActivateFn = async (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  const expectedRoles = route.data['roles'] as Array<string>;
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  const waitForUser = () =>
    new Promise<any>((resolve) => {
      const checkInterval = setInterval(() => {
        const user = userService.currentUser();
        if (user) {
          clearInterval(checkInterval);
          resolve(user);
        }
      }, 50);
    });

  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), 5000);
  });

  const user = await Promise.race([waitForUser(), timeoutPromise]);

  if (!user) {
    console.error('[Guard] Quá thời gian chờ thông tin User từ API!');
    router.navigate(['/']);
    return false;
  }

  const roleMap: Record<number, string> = {
    1: 'student',
    2: 'department',
    3: 'admin',
  };

  const currentRoleString = roleMap[user.roleType] || 'unknown';

  if (!expectedRoles.includes(currentRoleString)) {
    console.warn(
      `[Guard] Lùi lại! Role của bạn là '${currentRoleString}' (Mã: ${user.roleType}), không có quyền vào đây.`,
    );
    router.navigate(['/forbidden']);
    return false;
  }

  return true;
};
