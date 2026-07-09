import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { NotificationCenterComponent } from '@my-mfe/ui';
import { UserService } from '@my-mfe/auth';

@Component({
  selector: 'app-admin-notification-center',
  standalone: true,
  imports: [NotificationCenterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<lib-notification-center [roleContext]="roleContext()" />`,
})
export class AdminNotificationCenterComponent {
  private userService = inject(UserService);

  /** Phân biệt department (roleType=2) và admin (roleType=3) */
  roleContext = computed(() => {
    const role = this.userService.currentUser()?.roleType;
    return role === 2 ? 'department' as const : 'admin' as const;
  });
}
