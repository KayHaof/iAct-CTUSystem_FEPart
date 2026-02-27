import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

// Imports từ thư viện dùng chung
import { PaginationComponent } from '@my-mfe/ui';

// Imports từ Shared UI nội bộ của Admin
import { StatsGridComponent, AdminStat } from '../../../shared/ui/stats-grid/stats-grid.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { TableContainerComponent } from '../../../shared/ui/table-container/table-container.component';

// Model
import { Activity } from '../../../shared/models/activity.model';

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
export class ActivityListComponent {
  private router = inject(Router);

  // 1. Quản lý trạng thái bằng Signals
  searchQuery = signal('');
  currentPage = signal(1);
  pageSize = signal(10);

  // 2. Mock dữ liệu thống kê cho Admin
  activityStats = signal<AdminStat[]>([
    {
      label: 'Active Events',
      value: 12,
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

  // Cập nhật lại mảng allActivities
  allActivities = signal<Activity[]>([
    {
      id: 1, // Đổi từ string sang number
      title: 'Intro to Generative AI',
      startDate: '2023-10-24T10:00:00',
      endDate: '2023-10-24T12:00:00',
      registeredCount: 120,
      maxParticipants: 150, // Đổi từ maxCapacity
      status: 2, // Đổi từ 'Approved' sang số (Giả sử 2 = Approved, 1 = Pending, 0 = Draft)
      thumbnail: 'https://res.cloudinary.com/dhjamvg6j/image/upload/v1770173915/logo_ycoscg.png', // Đổi từ imageUrl
    } as Activity, // Dùng 'as Activity' để bỏ qua các trường không cần thiết lúc mock UI
    {
      id: 2,
      title: 'Leadership Summit 2023',
      startDate: '2023-11-02T09:00:00',
      endDate: '2023-11-02T16:00:00',
      registeredCount: 45,
      maxParticipants: 300,
      status: 1, // Pending
      thumbnail: 'https://via.placeholder.com/50',
    } as Activity,
    {
      id: 3,
      title: 'Faculty Networking',
      startDate: '2023-12-10T17:30:00',
      endDate: '2023-12-10T20:00:00',
      registeredCount: 0,
      maxParticipants: 50,
      status: 0, // Draft
      thumbnail: 'https://via.placeholder.com/50',
    } as Activity,
  ]);

  // 4. Logic tự động lọc và phân trang (Computed)
  filteredActivities = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.allActivities().filter((a) => a.title.toLowerCase().includes(query));
  });

  paginatedActivities = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredActivities().slice(start, end);
  });

  // 5. Các hàm xử lý sự kiện
  onSearch(keyword: string) {
    this.searchQuery.set(keyword);
    this.currentPage.set(1); // Reset về trang 1 khi tìm kiếm
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getCapacityPercentage(current: number, max: number): number {
    return max === 0 ? 0 : (current / max) * 100;
  }

  viewDetails(id: number) {
    console.log('Xem chi tiết:', id);
  }
}
