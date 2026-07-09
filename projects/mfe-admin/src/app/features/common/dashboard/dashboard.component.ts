import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '@my-mfe/auth';

import { DashboardService, RecentActivity } from './dashboard.service';

interface DashboardCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  roleLabel: string;
  recentTitle: string;
  recentLink: string;
  primaryAction: QuickAction;
}

interface DashboardStatCard {
  label: string;
  value: number;
  meta: string;
  icon: string;
  tone: 'primary' | 'success' | 'info' | 'warning' | 'slate';
}

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  link: string;
  tone: 'primary' | 'success' | 'info' | 'warning' | 'teal' | 'slate';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly userService = inject(UserService);

  readonly isLoading = signal(true);
  readonly recentActivities = signal<RecentActivity[]>([]);
  readonly totalActivities = signal(0);
  readonly activeActivities = signal(0);
  readonly pendingActivities = signal(0);
  readonly totalStudents = signal(0);
  readonly totalDepartments = signal(0);
  readonly totalMajors = signal(0);

  readonly isAdminRole = computed(() => this.userService.currentUser()?.roleType === 3);

  readonly dashboardCopy = computed<DashboardCopy>(() => {
    if (this.isAdminRole()) {
      return {
        eyebrow: 'Quản trị hệ thống',
        title: 'Tổng quan vận hành toàn trường',
        subtitle: 'Theo dõi dữ liệu nền, hoạt động cần duyệt và các cấu hình dùng chung của iAct.',
        roleLabel: 'Admin',
        recentTitle: 'Hoạt động cần theo dõi',
        recentLink: '/admin/activity-moderation',
        primaryAction: {
          label: 'Duyệt hoạt động',
          description: 'Xem các đề xuất từ đơn vị',
          icon: 'bi bi-check2-circle',
          link: '/admin/activity-moderation',
          tone: 'success',
        },
      };
    }

    return {
      eyebrow: 'Ban tổ chức',
      title: 'Tổng quan hoạt động của đơn vị',
      subtitle:
        'Theo dõi hoạt động đang phụ trách, trạng thái duyệt và thao tác vận hành hằng ngày.',
      roleLabel: 'BTC / Đơn vị',
      recentTitle: 'Hoạt động của đơn vị',
      recentLink: '/admin/org/activities',
      primaryAction: {
        label: 'Tạo hoạt động',
        description: 'Khởi tạo bản nháp hoặc gửi duyệt',
        icon: 'bi bi-plus-lg',
        link: '/admin/org/activities/create',
        tone: 'primary',
      },
    };
  });

  readonly statCards = computed<DashboardStatCard[]>(() => {
    if (this.isAdminRole()) {
      return [
        {
          label: 'Sinh viên',
          value: this.totalStudents(),
          meta: 'Tài khoản sinh viên trong hệ thống',
          icon: 'bi bi-mortarboard-fill',
          tone: 'info',
        },
        {
          label: 'Chờ duyệt',
          value: this.pendingActivities(),
          meta: 'Hoạt động đơn vị gửi lên',
          icon: 'bi bi-hourglass-split',
          tone: 'warning',
        },
        {
          label: 'Khoa / đơn vị',
          value: this.totalDepartments(),
          meta: 'Đơn vị đào tạo đang quản lý',
          icon: 'bi bi-building-fill',
          tone: 'success',
        },
        {
          label: 'Chuyên ngành',
          value: this.totalMajors(),
          meta: 'Cấu trúc đào tạo đã khai báo',
          icon: 'bi bi-diagram-3-fill',
          tone: 'slate',
        },
      ];
    }

    return [
      {
        label: 'Hoạt động phụ trách',
        value: this.totalActivities(),
        meta: 'Tổng số hoạt động của đơn vị',
        icon: 'bi bi-calendar-event-fill',
        tone: 'primary',
      },
      {
        label: 'Đang diễn ra',
        value: this.activeActivities(),
        meta: 'Cần theo dõi đăng ký và tham gia',
        icon: 'bi bi-broadcast-pin',
        tone: 'success',
      },
      {
        label: 'Chờ duyệt',
        value: this.pendingActivities(),
        meta: 'Đang chờ admin duyệt cấp trường',
        icon: 'bi bi-hourglass-split',
        tone: 'warning',
      },
      {
        label: 'Cập nhật gần đây',
        value: this.recentActivities().length,
        meta: 'Hoạt động có thay đổi mới',
        icon: 'bi bi-clock-history',
        tone: 'info',
      },
    ];
  });

  readonly quickActions = computed<QuickAction[]>(() => {
    if (this.isAdminRole()) {
      return [
        {
          label: 'Quản lý người dùng',
          description: 'Tài khoản, vai trò và hồ sơ',
          icon: 'bi bi-person-video3',
          link: '/admin/user-management',
          tone: 'info',
        },
        this.dashboardCopy().primaryAction,
        {
          label: 'Học kỳ',
          description: 'Mở khóa và cấu hình kỳ',
          icon: 'bi bi-calendar-range',
          link: '/admin/semesters',
          tone: 'primary',
        },
        {
          label: 'Danh mục DRL',
          description: 'Nhóm tiêu chí và điểm',
          icon: 'bi bi-diagram-3-fill',
          link: '/admin/categories',
          tone: 'teal',
        },
        {
          label: 'Đơn vị đào tạo',
          description: 'Khoa, Trường, Viện',
          icon: 'bi bi-building-fill',
          link: '/admin/departments',
          tone: 'success',
        },
        {
          label: 'Lớp sinh hoạt',
          description: 'Lớp, khóa và chuyên ngành',
          icon: 'bi bi-collection-fill',
          link: '/admin/classes',
          tone: 'slate',
        },
      ];
    }

    return [
      this.dashboardCopy().primaryAction,
      {
        label: 'Quản lý hoạt động',
        description: 'Danh sách, bản nháp và chỉnh sửa',
        icon: 'bi bi-calendar-plus',
        link: '/admin/org/activities',
        tone: 'success',
      },
      {
        label: 'Duyệt minh chứng',
        description: 'Xử lý tham gia của sinh viên',
        icon: 'bi bi-patch-check-fill',
        link: '/admin/org/activities',
        tone: 'warning',
      },
      {
        label: 'Thông báo',
        description: 'Theo dõi phản hồi từ hệ thống',
        icon: 'bi bi-bell-fill',
        link: '/admin/notifications',
        tone: 'info',
      },
    ];
  });

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

  getActivityIcon(activity: RecentActivity): string {
    if (activity.status === 0) return 'bi bi-hourglass-split';
    if (activity.status === 1) return 'bi bi-broadcast-pin';
    if (activity.status === 2) return 'bi bi-check-circle';
    if (activity.status === 3) return 'bi bi-x-circle';
    return 'bi bi-calendar-event';
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 0:
        return 'badge-status badge-status--pending';
      case 1:
        return 'badge-status badge-status--active';
      case 2:
        return 'badge-status badge-status--ended';
      case 3:
        return 'badge-status badge-status--rejected';
      default:
        return 'badge-status badge-status--pending';
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
