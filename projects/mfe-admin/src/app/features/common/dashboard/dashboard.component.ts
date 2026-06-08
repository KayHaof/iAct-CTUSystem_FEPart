import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, RecentActivity } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  isLoading = signal(true);
  recentActivities = signal<RecentActivity[]>([]);
  totalActivities = signal(0);
  activeActivities = signal(0);
  pendingActivities = signal(0);
  totalStudents = signal(0);
  totalDepartments = signal(0);
  totalMajors = signal(0);

  ngOnInit(): void {
    this.loadData();
  }

  refresh(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.dashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        this.totalActivities.set(stats.totalActivities);
        this.activeActivities.set(stats.activeActivities);
        this.pendingActivities.set(stats.pendingActivities);
        this.totalStudents.set(stats.totalStudents);
        this.totalDepartments.set(stats.totalDepartments);
        this.totalMajors.set(stats.totalMajors);
        this.recentActivities.set(stats.recentActivities);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading.set(false);
        this.recentActivities.set([]);
      },
    });
  }

  getActivityThumbBg(activity: RecentActivity): string {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    ];
    const index = activity.id % colors.length;
    return colors[index];
  }

  getActivityIcon(activity: RecentActivity): string {
    if (activity.status === 1) return 'bi bi-hourglass-split';
    if (activity.status === 2) return 'bi bi-check-circle';
    if (activity.status === 3) return 'bi bi-x-circle';
    return 'bi bi-calendar-event';
  }

  getBadgeStyle(status: number): string {
    return '';
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 0: return 'badge-status badge-status--pending';
      case 1: return 'badge-status badge-status--active';
      case 2: return 'badge-status badge-status--ended';
      case 3: return 'badge-status badge-status--rejected';
      default: return 'badge-status badge-status--pending';
    }
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 0:
        return 'Chờ duyệt';
      case 1:
        return 'Đang diễn ra';
      case 2:
        return 'Đã kết thúc';
      case 3:
        return 'Bị từ chối';
      default:
        return 'Không xác định';
    }
  }

  getTimeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return '1 ngày trước';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }
}
