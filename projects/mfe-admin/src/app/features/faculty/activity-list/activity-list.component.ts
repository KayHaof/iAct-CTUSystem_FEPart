import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

// Imports từ thư viện dùng chung
import { PaginationComponent } from '@my-mfe/ui';
import { AlertService, ConfirmService } from '@my-mfe/ui';

// Imports từ Shared UI nội bộ của Admin
import { StatsGridComponent, AdminStat } from '../../../shared/ui/stats-grid/stats-grid.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { TableContainerComponent } from '../../../shared/ui/table-container/table-container.component';

// Model & Service
import { Activity } from '../../../shared/models/activity.model';
import { ActivityService } from '../services/activity.service';

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PaginationComponent,
    StatsGridComponent,
    PageHeaderComponent,
    TableContainerComponent,
  ],
  templateUrl: './activity-list.component.html',
})
export class ActivityListComponent implements OnInit {
  private router = inject(Router);
  private activityService = inject(ActivityService);
  private alertService = inject(AlertService);
  private confirmService = inject(ConfirmService);
  // 1. Quản lý trạng thái bằng Signals
  searchQuery = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  isLoading = signal(false);

  // 2. Dữ liệu thống kê cho Admin
  activityStats = signal<AdminStat[]>([
    {
      label: 'Active Events',
      value: 12090,
      icon: 'bi bi-calendar-event',
      color: 'blue',
      trend: '+2 new',
    },
    { label: 'Pending Approvals', value: 3, icon: 'bi bi-clipboard-check', color: 'orange' },
    {
      label: 'Total Registered',
      value: 850,
      icon: 'bi bi-people',
      color: 'purple',
      trend: '↑ 12%',
    },
    { label: 'Points Disbursed', value: '1,200', icon: 'bi bi-star', color: 'green' },
  ]);

  // 3. Khởi tạo mảng rỗng chứa dữ liệu thật
  allActivities = signal<Activity[]>([]);

  // 4. Lifecycle Hook
  ngOnInit(): void {
    this.fetchActivities();
  }

  // Hàm gọi API lấy danh sách hoạt động
  fetchActivities(): void {
    this.isLoading.set(true);

    this.activityService
      .getAllActivities()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data: Activity[]) => {
          this.allActivities.set(data || []);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Lỗi khi tải danh sách hoạt động:', err);
          const errMsg = err.error?.message || 'Không thể tải dữ liệu hoạt động!';
          this.alertService.error(errMsg);
        },
      });
  }
  // 5. Logic tự động lọc và phân trang (Computed)
  filteredActivities = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.allActivities().filter((a) => a.title.toLowerCase().includes(query));
  });

  paginatedActivities = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredActivities().slice(start, end);
  });

  // 6. Các hàm xử lý sự kiện
  onSearch(keyword: string): void {
    this.searchQuery.set(keyword);
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  async deleteActivity(id: number): Promise<void> {
    // 1. Gọi popup xác nhận và chờ người dùng bấm nút
    const isConfirmed = await this.confirmService.confirm(
      'Bạn có chắc chắn muốn xóa?',
      'Dữ liệu của hoạt động này sẽ bị xóa vĩnh viễn và không thể khôi phục!',
      'Đồng ý, xóa luôn!',
      'Hủy bỏ',
    );

    // 2. Nếu người dùng chọn "Đồng ý, xóa luôn!" (trả về true)
    if (isConfirmed) {
      this.isLoading.set(true);

      this.activityService
        .deleteActivity(id)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: () => {
            this.alertService.success('Đã xóa hoạt động thành công!');
            // Load lại danh sách mới nhất sau khi xóa
            this.fetchActivities();
          },
          error: (err: HttpErrorResponse) => {
            console.error('Lỗi khi xóa:', err);
            const errMsg = err.error?.message || 'Không thể xóa hoạt động này. Vui lòng thử lại!';
            this.alertService.error(errMsg);
          },
        });
    }
  }
}
