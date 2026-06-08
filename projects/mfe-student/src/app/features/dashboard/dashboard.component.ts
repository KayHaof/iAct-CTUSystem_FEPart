import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '@my-mfe/auth';
import { ActivityItem, ProofItem } from './models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private userService = inject(UserService);

  // User info
  userName = 'Nguyen Van A';
  todayMessage = 'Hom nay la ngay tot de tham gia hoat dong!';

  // Stats
  totalScore = 85;
  maxScore = 100;
  rank = 'Kha';
  completedActivities = 12;
  upcomingActivities = 2;
  socialDays = 8;
  certificates = 0;

  // Computed
  get scorePercentage(): number {
    return Math.round((this.totalScore / this.maxScore) * 100);
  }

  // Data lists
  upcomingActivitiesList: (ActivityItem & { thumbBg: string; thumbIcon: string; badgeClass: string; actionRequired: string })[] = [];
  pendingProofs: ProofItem[] = [];

  criteriaScores = [
    { name: 'Dieu 1: Hoc tap', current: 18, max: 20, color: 'var(--primary, #2563eb)' },
    { name: 'Dieu 2: Chap hanh quy che', current: 25, max: 25, color: 'var(--success, #10b981)' },
    { name: 'Dieu 3: Hoat dong chinh tri', current: 15, max: 20, color: '#8b5cf6' },
    { name: 'Dieu 4: Pham chat cong dan', current: 20, max: 25, color: 'var(--warning, #f59e0b)' },
    { name: 'Dieu 5: Can bo lop', current: 7, max: 10, color: '#ef4444' },
  ];

  ngOnInit(): void {
    this.loadMockData();
  }

  refresh(): void {
    this.loadMockData();
  }

  private loadMockData(): void {
    // Mock upcoming activities
    this.upcomingActivitiesList = [
      {
        id: '1',
        title: 'Hoi thao AI & Future',
        department: 'Khoa CNTT',
        date: '10/03/2026',
        status: 'active',
        thumbBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        thumbIcon: 'bi bi-robot',
        badgeClass: 'badge-active',
        actionRequired: 'CHECK_IN'
      },
      {
        id: '2',
        title: 'Hien mau tinh nguyen',
        department: 'Doan thanh nien',
        date: '14/02/2026',
        status: 'upcoming',
        thumbBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        thumbIcon: 'bi bi-heart-pulse',
        badgeClass: 'badge-upcoming',
        actionRequired: 'REGISTER'
      },
      {
        id: '3',
        title: 'Workshop Ky nang mem',
        department: 'Khoa QTKD',
        date: '20/02/2026',
        status: 'upcoming',
        thumbBg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        thumbIcon: 'bi bi-person-workspace',
        badgeClass: 'badge-upcoming',
        actionRequired: 'NONE'
      }
    ];

    // Mock pending proofs
    this.pendingProofs = [
      {
        id: '4',
        title: 'Mua he xanh 2025',
        date: '20/07/2025',
        deadline: '15/03/2026'
      },
      {
        id: '5',
        title: 'Cuoc thi Olympic Tin hoc',
        date: '10/12/2025',
        deadline: '20/03/2026'
      }
    ];
  }

  onActivityClick(id: string): void {
    this.router.navigate(['/activity-hub', id]);
  }

  onSubmitProof(id: string): void {
    this.router.navigate(['/submit-proof'], { queryParams: { activityId: id } });
  }
}
