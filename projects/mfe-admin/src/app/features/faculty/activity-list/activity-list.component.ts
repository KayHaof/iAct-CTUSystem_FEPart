import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import {
  PaginationComponent,
  AlertService,
  ConfirmService,
  TableContainerComponent,
  PageHeaderComponent,
} from '@my-mfe/ui';
import { CloudinaryPathPipe } from '@my-mfe/data-access-media';
import { NotificationService } from '@my-mfe/data-access-notification';
import { Activity } from '../../../shared/models/activity.model';
import { ActivityService } from '../services/activity.service';
import { ParticipantService } from '../services/participant.service';
import { PageDTO, RegistrationResponse, UrgentNotificationRequest } from '@my-mfe/interface';

interface ActivityNotificationForm {
  title: string;
  message: string;
  priority: 1 | 2 | 3;
}

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PaginationComponent,
    PageHeaderComponent,
    TableContainerComponent,
    NgOptimizedImage,
    CloudinaryPathPipe,
  ],
  templateUrl: './activity-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityListComponent implements OnInit {
  private router = inject(Router);
  private activityService = inject(ActivityService);
  private participantService = inject(ParticipantService);
  private notificationService = inject(NotificationService);
  private alertService = inject(AlertService);
  private confirmService = inject(ConfirmService);

  // --- QUẢN LÝ TRẠNG THÁI ---
  searchQuery = signal('');
  currentTab = signal('ALL');

  currentPage = signal(1);
  pageSize = signal(5);
  isLoading = signal(false);

  totalRows = signal(0);
  totalPage = signal(0);
  activities = signal<Activity[]>([]);
  selectedNotificationActivity = signal<Activity | null>(null);
  isSendingNotification = signal(false);
  recipientCountPreview = signal<number | null>(null);

  notificationForm: ActivityNotificationForm = {
    title: '',
    message: '',
    priority: 2,
  };

  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.fetchActivities();
  }

  fetchActivities(): void {
    this.isLoading.set(true);

    let apiLevel = 'ALL';
    let apiStatus = 'EXCLUDE_DRAFT';

    if (this.currentTab() === 'DRAFT') {
      apiLevel = 'ALL';
      apiStatus = '3';
    } else {
      apiLevel = this.currentTab();
    }

    this.activityService
      .getAllActivities(
        this.searchQuery(),
        apiLevel,
        apiStatus,
        this.currentPage(),
        this.pageSize(),
      )
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response: PageDTO<Activity>) => {
          this.activities.set(response.data || []);
          this.totalRows.set(response.totalRows);
          this.totalPage.set(response.totalPage);
        },
        error: (err: HttpErrorResponse) => {
          this.alertService.error(err.error?.message || 'Lỗi tải dữ liệu!');
        },
      });
  }

  // --- ACTIONS ---

  // 1. KHI NGƯỜI DÙNG GÕ PHÍM (Đợi 3s)
  onSearch(keyword: string): void {
    this.searchQuery.set(keyword);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.fetchActivities();
    }, 3000);
  }

  // 2. KHI NGƯỜI DÙNG BẤM ENTER (Chạy ngay lập tức)
  onSearchEnter(keyword: string): void {
    this.searchQuery.set(keyword);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.currentPage.set(1);
    this.fetchActivities();
  }

  onTabChange(tab: string): void {
    this.currentTab.set(tab);
    this.currentPage.set(1);
    this.fetchActivities();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.fetchActivities();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.fetchActivities();
  }

  getCapacityPercentage(current: number, max: number): number {
    if (!max || max === 0) return 0;
    return (current / max) * 100;
  }

  viewDetails(id: number): void {
    this.router.navigate(['/admin/org/activities/detail', id]);
  }

  editActivity(id: number): void {
    this.router.navigate(['/admin/org/activities/edit', id]);
  }

  openNotificationModal(activity: Activity): void {
    if (activity.status !== 1) {
      this.alertService.warning('Chỉ có thể gửi thông báo cho hoạt động đã được duyệt.');
      return;
    }

    this.selectedNotificationActivity.set(activity);
    this.recipientCountPreview.set(activity.registeredCount ?? null);
    this.notificationForm = {
      title: `Thông báo về hoạt động: ${activity.title}`,
      message: '',
      priority: 2,
    };
  }

  closeNotificationModal(): void {
    if (this.isSendingNotification()) {
      return;
    }

    this.selectedNotificationActivity.set(null);
    this.recipientCountPreview.set(null);
    this.notificationForm = {
      title: '',
      message: '',
      priority: 2,
    };
  }

  canSendNotification(): boolean {
    return !!(
      this.selectedNotificationActivity() &&
      this.notificationForm.title.trim() &&
      this.notificationForm.message.trim() &&
      !this.isSendingNotification()
    );
  }

  sendActivityNotification(): void {
    const activity = this.selectedNotificationActivity();
    if (!activity || !this.canSendNotification()) {
      return;
    }

    const pageSize = Math.max(activity.registeredCount || 0, activity.maxParticipants || 0, 1000);
    this.isSendingNotification.set(true);

    this.participantService
      .getParticipantsByActivity(activity.id, '', 'ALL', 1, pageSize)
      .subscribe({
        next: (response) => {
          const participants = response.data?.data || [];
          const recipientIds = this.getActiveRecipientIds(participants);

          if (recipientIds.length === 0) {
            this.isSendingNotification.set(false);
            this.alertService.warning(
              'Hoạt động này chưa có sinh viên đăng ký hợp lệ để nhận thông báo.',
            );
            return;
          }

          const payload: UrgentNotificationRequest = {
            title: this.notificationForm.title.trim(),
            message: this.notificationForm.message.trim(),
            priority: this.notificationForm.priority,
            targetType: 'ACTIVITY',
            targetId: activity.id,
            activityId: activity.id,
            userIds: recipientIds,
          };

          this.notificationService.sendUrgentNotification(payload).subscribe({
            next: (res) => {
              const count = res.data ?? res.result ?? recipientIds.length;
              this.alertService.success(`Đã gửi thông báo đến ${count} sinh viên đăng ký.`);
              this.isSendingNotification.set(false);
              this.closeNotificationModal();
            },
            error: (err: HttpErrorResponse) => {
              this.isSendingNotification.set(false);
              this.alertService.error(
                err.error?.message || 'Không thể gửi thông báo. Vui lòng thử lại.',
              );
            },
          });
        },
        error: (err: HttpErrorResponse) => {
          this.isSendingNotification.set(false);
          this.alertService.error(
            err.error?.message || 'Không thể tải danh sách sinh viên đã đăng ký.',
          );
        },
      });
  }

  private getActiveRecipientIds(participants: RegistrationResponse[]): string[] {
    return [
      ...new Set(
        participants
          .filter((participant) => participant.status !== 2)
          .map((participant) => participant.studentId)
          .filter((studentId): studentId is number => typeof studentId === 'number')
          .map((studentId) => studentId.toString()),
      ),
    ];
  }

  async deleteActivity(id: number): Promise<void> {
    await this.confirmService.confirm({
      title: 'Bạn có chắc chắn muốn xóa?',
      message: 'Dữ liệu sẽ bị xóa vĩnh viễn!',
      confirmText: 'Xóa luôn!',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: () => {
        this.isLoading.set(true);
        this.activityService
          .deleteActivity(id)
          .pipe(finalize(() => this.isLoading.set(false)))
          .subscribe({
            next: () => {
              this.alertService.success('Đã xóa thành công!');
              this.fetchActivities();
            },
            error: () => this.alertService.error('Lỗi khi xóa!'),
          });
      },
    });
  }
}
