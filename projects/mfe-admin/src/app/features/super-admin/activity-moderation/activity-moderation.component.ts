import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '@my-mfe/ui';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

import { ActivityModerationService } from '../services/activity-moderation.service';
import {
  ModerationStats,
  ModerationFilters,
} from '../../../shared/models/activity-moderation.model';
import { Activity } from '../../../shared/models/activity.model';

// Import các component con
import { ModerationStatsComponent } from './moderation-stats/moderation-stats.component';
import { ModerationFiltersComponent } from './moderation-filters/moderation-filters.component';
import { ModerationTableComponent } from './moderation-table/moderation-table.component';

// Import các Modal component
import { ViewActivityModalComponent } from './modals/view-activity-modal/view-activity-modal.component';
import { RejectActivityModalComponent } from './modals/reject-activity-modal/reject-activity-modal.component';
import { ViewRejectReasonModalComponent } from './modals/view-reject-reason-modal/view-reject-reason-modal.component';

type ModalType = 'view' | 'reject' | 'viewReason';

@Component({
  selector: 'app-activity-moderation',
  standalone: true,
  imports: [
    CommonModule,
    ModerationStatsComponent,
    ModerationFiltersComponent,
    ModerationTableComponent,
    ViewActivityModalComponent,
    RejectActivityModalComponent,
    ViewRejectReasonModalComponent,
  ],
  templateUrl: './activity-moderation.component.html',
  styleUrls: ['./activity-moderation.component.scss'],
})
export class ActivityModerationComponent implements OnInit {
  private moderationService = inject(ActivityModerationService);
  private alertService = inject(AlertService);

  // --- Signals quản lý trạng thái ---
  isLoading = signal(false);
  stats = signal<ModerationStats | null>(null);
  activities = signal<Activity[]>([]);

  // Signals cho bộ lọc và phân trang
  currentFilters = signal<ModerationFilters>({
    departmentId: null,
    status: 'ALL',
  });
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);

  selectedActivityForAction = signal<Activity | null>(null);

  modalStates = signal<Record<ModalType, boolean>>({
    view: false,
    reject: false,
    viewReason: false,
  });

  ngOnInit(): void {
    this.loadStats();
    this.loadActivities();
  }

  loadStats(): void {
    this.moderationService.getStats().subscribe({
      next: (res) => this.stats.set(res.data ?? null),
      error: () => this.alertService.error('Lỗi khi tải dữ liệu thống kê!'),
    });
  }

  loadActivities(): void {
    this.isLoading.set(true);
    const apiPage = this.currentPage();

    this.moderationService
      .getFilteredActivities(this.currentFilters(), apiPage, this.pageSize())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.activities.set(res.data?.data || []);
          this.totalItems.set(res.data?.totalRows || 0);
        },
        error: () => this.alertService.error('Lỗi khi tải danh sách hoạt động!'),
      });
  }

  handleFilterApplied(newFilters: ModerationFilters): void {
    this.currentFilters.set(newFilters);
    this.currentPage.set(1);
    this.loadActivities();
  }

  handlePageChange(newPage: number): void {
    this.currentPage.set(newPage);
    this.loadActivities();
  }

  handlePageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.currentPage.set(1);
    this.loadActivities();
  }

  onApproveActivity(activity: Activity): void {
    Swal.fire({
      title: 'Xác nhận phê duyệt',
      html: `Bạn có chắc chắn muốn duyệt hoạt động:<br><span class="font-bold text-indigo-600">${activity.title}</span>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#f43f5e',
      confirmButtonText: '<i class="bi bi-check-lg mr-1"></i> Phê duyệt ngay',
      cancelButtonText: 'Hủy bỏ',
      reverseButtons: true,
      customClass: {
        confirmButton: 'px-6 py-2.5 rounded-xl font-bold shadow-md',
        cancelButton: 'px-6 py-2.5 rounded-xl font-bold',
        popup: 'rounded-2xl',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading.set(true);
        this.moderationService.approveActivity(activity.id.toString()).subscribe({
          next: () => {
            Swal.fire({
              title: 'Đã phê duyệt!',
              text: 'Hoạt động đã được duyệt thành công.',
              icon: 'success',
              confirmButtonColor: '#10b981',
              customClass: { confirmButton: 'rounded-xl px-6 py-2' },
            });

            this.loadStats();
            this.loadActivities();
          },
          error: () => {
            Swal.fire({
              title: 'Lỗi!',
              text: 'Có lỗi xảy ra khi phê duyệt hoạt động.',
              icon: 'error',
              confirmButtonColor: '#f43f5e',
              customClass: { confirmButton: 'rounded-xl px-6 py-2' },
            });
          },
          complete: () => this.isLoading.set(false),
        });
      }
    });
  }

  openRejectModal(activity: Activity): void {
    this.selectedActivityForAction.set(activity);
    this.toggleModal('reject', true);
  }

  onConfirmReject(reason: string): void {
    const activity = this.selectedActivityForAction();
    if (!activity || !reason) return;

    this.isLoading.set(true);
    this.moderationService.rejectActivity(activity.id.toString(), reason).subscribe({
      next: () => {
        this.alertService.success('Đã từ chối hoạt động thành công!');
        this.toggleModal('reject', false);
        this.loadStats();
        this.loadActivities();
      },
      error: () => this.alertService.error('Có lỗi xảy ra khi từ chối hoạt động!'),
      complete: () => {
        this.isLoading.set(false);
        this.selectedActivityForAction.set(null);
      },
    });
  }

  openViewModal(activity: Activity): void {
    this.selectedActivityForAction.set(activity);
    this.toggleModal('view', true);
  }

  openViewReasonModal(activity: Activity): void {
    this.selectedActivityForAction.set(activity);
    this.toggleModal('viewReason', true);
  }

  toggleModal(modalName: ModalType, state: boolean): void {
    this.modalStates.update((s) => ({ ...s, [modalName]: state }));
    if (!state) {
      this.selectedActivityForAction.set(null);
    }
  }
}
