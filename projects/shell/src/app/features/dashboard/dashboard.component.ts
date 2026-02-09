// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

// Import UserService từ Shared UI
import { UserService } from 'shared-ui';

import { WelcomeBannerComponent } from './components/welcome-banner/welcome-banner.component';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { ActivityListComponent } from './components/activity-list/activity-list.component';
import { CriteriaChartComponent } from './components/criteria-chart/criteria-chart.component';

import { DashboardData } from './models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    WelcomeBannerComponent,
    StatsCardComponent,
    ActivityListComponent,
    CriteriaChartComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  data: DashboardData | null = null;
  isLoading = true;

  // 1. Inject UserService để lấy thông tin User (public để HTML dùng được)
  public userService = inject(UserService);

  private cdr = inject(ChangeDetectorRef);

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('Dashboard Init: Bắt đầu load...');

    setTimeout(() => {
      this.data = MOCK_DATA;
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 800);
  }

  onActivityClick(id: string) {
    this.router.navigate(['/activity-hub', id]);
  }

  onSubmitProof(id: string) {
    this.router.navigate(['/submit-proof'], { queryParams: { activityId: id } });
  }
}

// DATA MẪU (Chỉ còn giữ lại dữ liệu Dashboard, không còn thông tin cá nhân)
const MOCK_DATA: DashboardData = {
  // Đã xóa fullName và studentCode

  totalScore: 85,
  rank: 'Tốt',
  socialDays: 12,
  upcomingCount: 2,

  activities: [
    {
      id: '1',
      title: 'Hội thảo AI & Future',
      date: '2026-02-10',
      time: '08:00',
      location: 'Hội trường Rùa',
      status: 'UPCOMING',
      actionRequired: 'CHECK_IN',
    },
    {
      id: '2',
      title: 'Hiến máu tình nguyện',
      date: '2026-02-14',
      time: '07:00',
      location: 'Sảnh Khoa CNTT',
      status: 'UPCOMING',
      actionRequired: 'NONE',
    },
  ],

  pendingProofs: [
    {
      id: '3',
      title: 'Mùa hè xanh 2025',
      date: '2025-07-20',
      time: '',
      location: '',
      status: 'COMPLETED',
      actionRequired: 'SUBMIT_PROOF',
    },
    {
      id: '4',
      title: 'Cuộc thi Olympic Tin học',
      date: '2025-12-10',
      time: '',
      location: '',
      status: 'COMPLETED',
      actionRequired: 'SUBMIT_PROOF',
    },
  ],

  featuredActivities: [
    {
      id: '5',
      title: 'Workshop: Kỹ năng viết CV',
      date: '2026-03-01',
      time: '14:00',
      location: 'Online',
      status: 'UPCOMING',
      actionRequired: 'NONE',
    },
    {
      id: '6',
      title: 'Giao lưu doanh nghiệp FPT',
      date: '2026-03-05',
      time: '08:00',
      location: 'C1',
      status: 'UPCOMING',
      actionRequired: 'NONE',
    },
  ],

  criteriaScores: [
    { name: 'Điều 1: Học tập', current: 18, max: 20, color: 'bg-blue-500' },
    { name: 'Điều 2: Chấp hành quy chế', current: 25, max: 25, color: 'bg-green-500' },
    { name: 'Điều 3: Hoạt động chính trị', current: 15, max: 20, color: 'bg-purple-500' },
    { name: 'Điều 4: Phẩm chất công dân', current: 20, max: 25, color: 'bg-amber-500' },
    { name: 'Điều 5: Cán bộ lớp', current: 7, max: 10, color: 'bg-rose-500' },
  ],
};
