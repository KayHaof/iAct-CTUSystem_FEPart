import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NotificationCenterComponent } from '@my-mfe/ui';

@Component({
  selector: 'app-student-notification-center',
  standalone: true,
  imports: [NotificationCenterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<lib-notification-center roleContext="student" />`,
})
export class StudentNotificationCenterComponent {}
