import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '@my-mfe/auth';
import { ApiResponse } from '@my-mfe/interface';
import { catchError, forkJoin, map, of } from 'rxjs';

import { ActivityItem, CriteriaScore, ProofItem } from './models/dashboard.model';
import { ActivityService } from '../../shared/services/activity.service';
import { ActivityRecord, RegistrationService } from '../../shared/services/registration.service';
import { Activity } from '../../shared/models/activity.model';

interface StudentStat {
  label: string;
  value: number | string;
  meta: string;
  icon: string;
  tone: 'primary' | 'success' | 'info' | 'warning';
}

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  link: string;
  tone: 'primary' | 'success' | 'info' | 'warning';
}

interface PointSummary {
  totalPoint: number;
  maxPoint: number;
  percentage: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

interface CategoryPoint {
  categoryName: string;
  maxPoint: number;
  earnedPoint: number;
}

interface PointDetailsResponse {
  categories: CategoryPoint[];
}

type DashboardActivity = ActivityItem & {
  tone: 'primary' | 'success' | 'info' | 'warning';
  actionLabel: string;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly activityService = inject(ActivityService);
  private readonly registrationService = inject(RegistrationService);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly apiUrl = 'http://localhost:8080/activity/api/v1';

  readonly studentName = computed(() => this.userService.currentUser()?.fullName || 'Sinh viên');
  readonly studentMeta = computed(() => {
    const user = this.userService.currentUser();
    const parts = [user?.studentCode, user?.classCode, user?.departmentName].filter(Boolean);
    return parts.length ? parts.join(' • ') : 'Theo dõi hoạt động và điểm rèn luyện cá nhân';
  });

  totalScore = 0;
  maxScore = 100;
  rank = 'Chưa xếp loại';
  completedActivities = 0;
  upcomingActivities = 0;
  socialDays = 0;

  upcomingActivitiesList: DashboardActivity[] = [];
  pendingProofs: ProofItem[] = [];

  readonly quickActions: QuickAction[] = [
    {
      label: 'Tìm hoạt động',
      description: 'Khám phá hoạt động đang mở đăng ký',
      icon: 'bi bi-compass',
      link: '/activity-hub',
      tone: 'primary',
    },
    {
      label: 'Quét QR',
      description: 'Check-in hoạt động đã đăng ký',
      icon: 'bi bi-qr-code-scan',
      link: '/qr-checkin',
      tone: 'success',
    },
    {
      label: 'Lịch sử tham gia',
      description: 'Theo dõi trạng thái và điểm cộng',
      icon: 'bi bi-clock-history',
      link: '/my-records',
      tone: 'info',
    },
    {
      label: 'Minh chứng cần nộp',
      description: 'Mở hoạt động của tôi để bổ sung hồ sơ',
      icon: 'bi bi-cloud-upload',
      link: '/my-records',
      tone: 'warning',
    },
  ];

  criteriaScores: CriteriaScore[] = [];

  get scorePercentage(): number {
    if (!this.maxScore) return 0;
    return Math.round((this.totalScore / this.maxScore) * 100);
  }

  get stats(): StudentStat[] {
    return [
      {
        label: 'Điểm rèn luyện',
        value: this.totalScore,
        meta: `Xếp loại ${this.rank} • ${this.scorePercentage}% mục tiêu`,
        icon: 'bi bi-star-fill',
        tone: 'primary',
      },
      {
        label: 'Đã tham gia',
        value: this.completedActivities,
        meta: `${this.upcomingActivities} hoạt động có thể đăng ký`,
        icon: 'bi bi-calendar-check-fill',
        tone: 'success',
      },
      {
        label: 'Ngày CTXH',
        value: this.socialDays,
        meta: 'Tạm tính theo hoạt động đã tham gia',
        icon: 'bi bi-people-fill',
        tone: 'info',
      },
      {
        label: 'Cần xử lý',
        value: this.pendingProofs.length,
        meta: 'Hoạt động cần bổ sung minh chứng',
        icon: 'bi bi-file-earmark-arrow-up',
        tone: 'warning',
      },
    ];
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  refresh(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    forkJoin({
      pointSummary: this.http
        .get<ApiResponse<PointSummary>>(`${this.apiUrl}/student-points/summary`)
        .pipe(
          map((response) => response.data ?? null),
          catchError(() => of(null)),
        ),
      pointDetails: this.http
        .get<ApiResponse<PointDetailsResponse>>(`${this.apiUrl}/student-points/details`)
        .pipe(
          map((response) => response.data ?? null),
          catchError(() => of(null)),
        ),
      records: this.registrationService.getMyRecords().pipe(
        map((response) => response.data ?? []),
        catchError(() => of([] as ActivityRecord[])),
      ),
      activities: this.activityService.getAllActivities('', 'ALL', 'ALL', 1, 3).pipe(
        map((page) => page.data ?? []),
        catchError(() => of([] as Activity[])),
      ),
    }).subscribe(({ pointSummary, pointDetails, records, activities }) => {
      this.applyPointSummary(pointSummary);
      this.criteriaScores = this.toCriteriaScores(pointDetails?.categories ?? []);
      this.completedActivities = records.filter((item) => item.status === 1).length;
      this.socialDays = this.completedActivities;
      this.pendingProofs = this.toPendingProofs(records);
      this.upcomingActivitiesList = this.toDashboardActivities(activities);
      this.upcomingActivities = this.upcomingActivitiesList.length;
      this.cdr.markForCheck();
    });
  }

  private applyPointSummary(summary: PointSummary | null): void {
    this.totalScore = summary?.totalPoint ?? 0;
    this.maxScore = summary?.maxPoint || 100;
    this.rank = summary ? this.getRankLabel(summary.status) : 'Chưa xếp loại';
  }

  private toCriteriaScores(categories: CategoryPoint[]): CriteriaScore[] {
    return categories.map((category, index) => ({
      name: category.categoryName,
      current: category.earnedPoint,
      max: category.maxPoint,
      color: this.getCriteriaColor(index),
    }));
  }

  private toPendingProofs(records: ActivityRecord[]): ProofItem[] {
    return records
      .filter(
        (record) =>
          record.canSubmitProof === true ||
          (record.status === 1 && (record.proofStatus === 0 || record.proofStatus === 3)),
      )
      .slice(0, 3)
      .map((record) => ({
        id: String(record.activityId),
        title: record.title,
        date: this.formatDate(record.startDate),
        deadline: 'Chưa có hạn nộp',
      }));
  }

  private toDashboardActivities(activities: Activity[]): DashboardActivity[] {
    return activities.slice(0, 3).map((activity) => ({
      id: String(activity.id),
      title: activity.title,
      department: activity.organizer?.departmentName || activity.departmentName || 'Đơn vị tổ chức',
      date: this.formatDate(activity.startDate),
      status: 'UPCOMING',
      actionRequired: 'REGISTER',
      tone: 'primary',
      actionLabel: 'Đăng ký',
      thumbIcon: 'bi bi-plus-circle',
    }));
  }

  private getRankLabel(status: PointSummary['status']): string {
    switch (status) {
      case 'excellent':
        return 'Xuất sắc';
      case 'good':
        return 'Tốt';
      case 'warning':
        return 'Trung bình';
      case 'danger':
        return 'Yếu';
      default:
        return 'Chưa xếp loại';
    }
  }

  private getCriteriaColor(index: number): string {
    return ['#2563eb', '#059669', '#7c3aed', '#d97706', '#dc2626'][index] ?? '#475569';
  }

  private formatDate(value?: string): string {
    if (!value) return 'Chưa cập nhật';
    return new Date(value).toLocaleDateString('vi-VN');
  }

  onActivityClick(id: string): void {
    this.router.navigate(['/activity-hub/detail', id]);
  }

  onSubmitProof(id: string): void {
    this.router.navigate(['/my-records'], { queryParams: { proofActivityId: id } });
  }
}
