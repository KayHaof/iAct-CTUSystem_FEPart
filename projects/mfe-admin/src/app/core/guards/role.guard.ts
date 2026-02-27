import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '@my-mfe/auth'; // Dùng lại UserService từ kho dùng chung

export const roleGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  // Lấy user hiện tại từ Signal
  const user = userService.currentUser();

  const expectedRoles = route.data['roles'] as Array<string>;

  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  if (!user) {
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
