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

  // Thêm Signal để quản lý hiển thị Modal QR
  showQrModal = signal<boolean>(false);

  capacityPercentage = computed(() => {
    const act = this.activity();
    if (!act || !act.maxParticipants) return 0;
    return ((act.registeredCount || 0) / act.maxParticipants) * 100;
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

  // Hàm chuyển sang trang sửa chữa (Edit)
  editActivity(): void {
    const act = this.activity();
    if (act && act.id) {
      // Điều hướng sang URL edit kèm theo ID của hoạt động
      this.router.navigate(['/admin/org/activities/edit', act.id]);
    }
  }

  async deleteActivity(): Promise<void> {
    const act = this.activity();
    if (!act || !act.id) return;

    const isConfirmed = await this.confirmService.confirm(
      'Bạn có chắc chắn muốn xóa?',
      'Dữ liệu của hoạt động này sẽ bị xóa vĩnh viễn và không thể khôi phục!',
      'Đồng ý, xóa luôn!',
      'Hủy bỏ',
    );

    if (isConfirmed) {
      this.isLoading.set(true);

      this.activityService
        .deleteActivity(act.id)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: () => {
            this.alertService.success('Đã xóa hoạt động thành công!');
            // Chuyển hướng về lại trang danh sách hoạt động
            this.router.navigate(['/admin/org/activities']);
          },
          error: (err: HttpErrorResponse) => {
            console.error('Lỗi khi xóa:', err);
            const errMsg = err.error?.message || 'Không thể xóa hoạt động này. Vui lòng thử lại!';
            this.alertService.error(errMsg);
          },
        });
    }
  }

  // Hàm chuyển sang trang Quản lý người tham gia
  manageParticipants(): void {
    const act = this.activity();
    if (act) {
      // Giả sử URL route của ní là /admin/org/activities/participants/:id
      this.router.navigate(['/admin/org/activities/participants', act.id]);
    }
  }

  // Hàm đóng/mở Modal QR
  toggleQrModal(show: boolean): void {
    this.showQrModal.set(show);
  }
}
