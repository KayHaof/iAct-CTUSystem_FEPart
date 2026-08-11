import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiResponse } from '@my-mfe/interface';
import { IACT_API_ORIGIN } from '@my-mfe/ui';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';

import { ActivityItem, ProofItem } from './models/dashboard.model';
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
  featured?: boolean;
}

interface PointSummary {
  totalPoint: number;
  maxPoint: number;
  percentage: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
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
  private readonly activityService = inject(ActivityService);
  private readonly registrationService = inject(RegistrationService);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiOrigin = inject(IACT_API_ORIGIN);

  private readonly apiUrl = `${this.apiOrigin}/activity/api/v1`;

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
      label: 'Điểm rèn luyện',
      description: 'Xem điểm và các mục rèn luyện của bạn',
      icon: 'bi bi-bar-chart-line',
      link: '/point-management',
      tone: 'primary',
      featured: true,
    },
    {
      label: 'Tìm hoạt động',
      description: 'Khám phá hoạt động đang mở đăng ký',
      icon: 'bi bi-compass',
      link: '/activity-hub',
      tone: 'primary',
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

  isLoading = true;

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
    this.isLoading = true;
    forkJoin({
      pointSummary: this.http
        .get<ApiResponse<PointSummary>>(`${this.apiUrl}/student-points/summary`)
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
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe(({ pointSummary, records, activities }) => {
        this.applyPointSummary(pointSummary);
        this.completedActivities = records.filter((item) => item.status === 1).length;
        this.socialDays = this.completedActivities;
        this.pendingProofs = this.toPendingProofs(records);
        this.upcomingActivitiesList = this.toDashboardActivities(activities);
        this.upcomingActivities = this.upcomingActivitiesList.length;
      });
  }

  private applyPointSummary(summary: PointSummary | null): void {
    this.totalScore = summary?.totalPoint ?? 0;
    this.maxScore = summary?.maxPoint || 100;
    this.rank = summary ? this.getRankLabel(summary.status) : 'Chưa xếp loại';
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
