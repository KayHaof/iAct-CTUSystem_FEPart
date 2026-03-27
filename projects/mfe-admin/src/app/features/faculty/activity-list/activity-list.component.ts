import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { PaginationComponent, AlertService, ConfirmService, TableContainerComponent, PageHeaderComponent } from '@my-mfe/ui';
import { CloudinaryPathPipe} from '@my-mfe/data-access-media';
import { Activity } from '../../../shared/models/activity.model';
import { ActivityService } from '../services/activity.service';
import { PageDTO } from 'interface';

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
})
export class ActivityListComponent implements OnInit {
  private router = inject(Router);
  private activityService = inject(ActivityService);
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

  async deleteActivity(id: number): Promise<void> {
    const isConfirmed = await this.confirmService.confirm(
      'Bạn có chắc chắn muốn xóa?',
      'Dữ liệu sẽ bị xóa vĩnh viễn!',
      'Xóa luôn!',
      'Hủy',
    );

    if (isConfirmed) {
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
    }
  }
}
