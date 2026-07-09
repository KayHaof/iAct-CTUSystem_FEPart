import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationFacade } from '@my-mfe/ui';
import {
  NotificationType,
  NOTIFICATION_TYPE_CONFIG,
} from '@my-mfe/interface';

@Component({
  selector: 'app-student-notification-detail',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-detail.component.html',
  styleUrls: ['./notification-detail.component.scss'],
})
export class StudentNotificationDetailComponent implements OnInit {
  readonly facade = inject(NotificationFacade);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.facade.loadDetail(id);
    }
  }

  getTypeConfig(type: NotificationType) {
    return NOTIFICATION_TYPE_CONFIG[type] ?? NOTIFICATION_TYPE_CONFIG[2];
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  goToActivity(activityId: number): void {
    this.router.navigate(['/activity-hub/detail', activityId]);
  }

  goBack(): void {
    this.router.navigate(['/notifications']);
  }
}
