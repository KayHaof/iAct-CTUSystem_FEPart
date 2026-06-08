import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { Activity } from '../../../shared/models/activity.model';
import { ActivityService } from '../services/activity.service';
import { AlertService, ConfirmService } from '@my-mfe/ui';

@Component({
  selector: 'app-activity-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-management.component.html',
  styleUrls: ['./activity-management.component.scss'],
})
export class ActivityManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private activityService = inject(ActivityService);
  private alertService = inject(AlertService);
  private confirmService = inject(ConfirmService);

  activity = signal<Activity | null>(null);
  isLoading = signal<boolean>(true);

  showQrModal = signal<boolean>(false);
  qrCodeImage = signal<string | null>(null);
  isGeneratingQr = signal<boolean>(false);

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

  manageParticipants(): void {
    const act = this.activity();
    if (act) {
      this.router.navigate(['/admin/org/activities/participants', act.id]);
    }
  }

  openQrModal(): void {
    const act = this.activity();
    if (!act || !act.id) return;

    this.showQrModal.set(true);
    if (this.qrCodeImage()) return;

    this.isGeneratingQr.set(true);
    this.activityService
      .getQrCode(act.id)
      .pipe(finalize(() => this.isGeneratingQr.set(false)))
      .subscribe({
        next: (res: any) => {
          this.qrCodeImage.set(res.data);
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
