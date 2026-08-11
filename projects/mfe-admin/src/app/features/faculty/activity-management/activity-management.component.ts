import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { Activity, ActivityScheduleDto } from '../../../shared/models/activity.model';
import { ActivityService } from '../services/activity.service';
import { UserService } from '@my-mfe/auth';
import { AlertService, ConfirmService } from '@my-mfe/ui';

type QrSchedule = ActivityScheduleDto & { id: number };

@Component({
  selector: 'app-activity-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-management.component.html',
  styleUrls: ['./activity-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private activityService = inject(ActivityService);
  private alertService = inject(AlertService);
  private confirmService = inject(ConfirmService);
  private userService = inject(UserService);

  activity = signal<Activity | null>(null);
  isLoading = signal<boolean>(true);
  readonly isDepartmentRole = computed(() => Number(this.userService.currentUser()?.roleType) === 2);

  showQrModal = signal<boolean>(false);
  qrCodeImage = signal<string | null>(null);
  isGeneratingQr = signal<boolean>(false);
  selectedQrScheduleId = signal<number | null>(null);
  qrCodeImagesBySchedule = signal<Record<number, string>>({});
  qrSchedules = computed<QrSchedule[]>(() =>
    (this.activity()?.schedules || []).filter(
      (schedule): schedule is QrSchedule =>
        typeof schedule.id === 'number' && Number.isFinite(schedule.id),
    ),
  );
  selectedQrSchedule = computed<QrSchedule | null>(() => {
    const selectedId = this.selectedQrScheduleId();
    return this.qrSchedules().find((schedule) => schedule.id === selectedId) || null;
  });

  capacityPercentage = computed(() => {
    const act = this.activity();
    if (!act || !act.maxParticipants) return 0;
    return ((act.registeredCount || 0) / act.maxParticipants) * 100;
  });

  totalPoints = computed(() => {
    const act = this.activity();
    if (!act || !act.benefits) return 0;
    return act.benefits.reduce((sum, b) => sum + (b.point || 0), 0);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchActivityDetails(id);
    } else {
      this.alertService.error('Không tìm thấy mã hoạt động!');
      this.goBack();
    }
  }

  fetchActivityDetails(id: string): void {
    this.isLoading.set(true);
    this.activityService
      .getActivityById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data: Activity) => {
          this.activity.set(data);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Lỗi khi tải chi tiết hoạt động:', err);
          this.alertService.error(err.error?.message || 'Không thể tải thông tin hoạt động!');
          this.goBack();
        },
      });
  }

  goBack(): void {
    this.location.back();
  }

  editActivity(): void {
    const act = this.activity();
    if (act && act.id) {
      this.router.navigate(['/admin/org/activities/edit', act.id]);
    }
  }

  async deleteActivity(): Promise<void> {
    const act = this.activity();
    if (!act || !act.id) return;

    try {
      await this.confirmService.danger({
        title: 'Bạn có chắc chắn muốn xóa?',
        message: 'Dữ liệu của hoạt động này sẽ bị xóa vĩnh viễn và không thể khôi phục!',
        confirmText: 'Đồng ý, xóa luôn!',
        cancelText: 'Hủy bỏ',
      });
      this.isLoading.set(true);
      this.activityService
        .deleteActivity(act.id)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: () => {
            this.alertService.success('Đã xóa hoạt động thành công!');
            this.router.navigate(['/admin/org/activities']);
          },
          error: (err: HttpErrorResponse) => {
            console.error('Lỗi khi xóa:', err);
            const errMsg = err.error?.message || 'Không thể xóa hoạt động này. Vui lòng thử lại!';
            this.alertService.error(errMsg);
          },
        });
    } catch {
      // User cancelled, do nothing
    }
  }

  canEditOrDelete(activity: Activity): boolean {
    if (activity.status === 3) {
      return true;
    }
    if (activity.status !== 0) {
      return false;
    }
    return !(this.isDepartmentRole() && this.isPendingAdminApproval(activity));
  }

  canRequestAdminSupport(activity: Activity): boolean {
    return this.isDepartmentRole() && this.isPendingAdminApproval(activity);
  }

  isPendingAdminApproval(activity: Activity): boolean {
    return activity.status === 0 && !!activity.requiresAdminApproval;
  }

  async requestAdminSupport(): Promise<void> {
    const act = this.activity();
    if (!act || !act.id) return;

    await this.confirmService.confirm({
      title: 'Gửi yêu cầu hỗ trợ?',
      message: 'Admin sẽ nhận thông báo về hoạt động đang chờ duyệt này.',
      confirmText: 'Gửi yêu cầu',
      cancelText: 'Hủy',
      type: 'warning',
      onConfirm: () => {
        this.isLoading.set(true);
        this.activityService
          .requestAdminSupport(act.id, 'Cần hỗ trợ hủy hoạt động đang chờ duyệt.')
          .pipe(finalize(() => this.isLoading.set(false)))
          .subscribe({
            next: () => {
              this.alertService.success('Đã gửi yêu cầu hỗ trợ lên admin.');
            },
            error: (err: HttpErrorResponse) => {
              console.error('Lỗi khi gửi yêu cầu hỗ trợ:', err);
              this.alertService.error(err.error?.message || 'Không thể gửi yêu cầu hỗ trợ.');
            },
          });
      },
    });
  }

  manageParticipants(): void {
    const act = this.activity();
    if (act) {
      this.router.navigate(['/admin/org/activities/participants', act.id]);
    }
  }

  openQrModal(): void {
    const act = this.activity();
    if (!act || !act.id) return;

    const schedules = this.qrSchedules();
    if (schedules.length === 0) {
      this.alertService.error('Hoạt động chưa có buổi chi tiết để tạo mã QR điểm danh.');
      return;
    }

    this.showQrModal.set(true);
    const selectedId = this.selectedQrScheduleId();
    const scheduleId =
      selectedId && schedules.some((schedule) => schedule.id === selectedId)
        ? selectedId
        : schedules[0].id;

    this.selectQrSchedule(scheduleId);
  }

  selectQrSchedule(scheduleId: number): void {
    const act = this.activity();
    if (!act || !act.id) return;

    this.selectedQrScheduleId.set(scheduleId);
    const cachedImage = this.qrCodeImagesBySchedule()[scheduleId];
    if (cachedImage) {
      this.qrCodeImage.set(cachedImage);
      return;
    }

    this.qrCodeImage.set(null);
    this.isGeneratingQr.set(true);
    this.activityService
      .getScheduleQrCode(act.id, scheduleId)
      .pipe(finalize(() => this.isGeneratingQr.set(false)))
      .subscribe({
        next: (res) => {
          const image = res.data?.qrCodeImage ?? null;
          if (!image) {
            this.qrCodeImage.set(null);
            return;
          }

          this.qrCodeImagesBySchedule.update((items) => ({
            ...items,
            [scheduleId]: image,
          }));
          if (this.selectedQrScheduleId() === scheduleId) {
            this.qrCodeImage.set(image);
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Lỗi khi tải mã QR:', err);
          this.alertService.error('Không thể tạo mã QR lúc này!');
          this.showQrModal.set(false);
        },
      });
  }

  closeQrModal(): void {
    this.showQrModal.set(false);
  }

  // ============ Helper Methods ============

  getStatusBadgeClass(status: number): string {
    const classes: Record<number, string> = {
      0: 'badge-admin--warning',
      1: 'badge-admin--success',
      2: 'badge-admin--danger',
      3: 'badge-admin--neutral',
    };
    return classes[status] || 'badge-admin--neutral';
  }

  getStatusIcon(status: number): string {
    const icons: Record<number, string> = {
      0: 'bi bi-hourglass-split',
      1: 'bi bi-check-circle-fill',
      2: 'bi bi-x-circle-fill',
      3: 'bi bi-file-earmark-text',
    };
    return icons[status] || 'bi bi-question-circle';
  }

  getStatusLabel(status: number): string {
    const labels: Record<number, string> = {
      0: 'Chờ duyệt',
      1: 'Đã duyệt',
      2: 'Từ chối',
      3: 'Bản nháp',
    };
    return labels[status] || 'Không xác định';
  }

  getLevelIcon(act: Activity): string {
    if (act.isExternal) return 'bi bi-globe';
    if (act.isFaculty) return 'bi bi-mortarboard-fill';
    return 'bi bi-bank';
  }

  getLevelLabel(act: Activity): string {
    if (act.isExternal) return 'Ngoài trường';
    if (act.isFaculty) return 'Cấp Khoa';
    return 'Cấp Trường';
  }
}
