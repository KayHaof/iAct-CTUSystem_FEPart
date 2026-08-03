import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, finalize } from 'rxjs';

import {
  AlertService,
  ConfirmDialogComponent,
  ConfirmService,
  PaginationComponent,
} from '@my-mfe/ui';
import { Activity } from '../../../shared/models/activity.model';
import {
  ActivityApprovalService,
  ActivityApprovalSortBy,
  ActivityApprovalSortDirection,
  ActivityApprovalStatus,
  ActivityRepresentativeLookup,
} from '../services/activity-approval.service';

interface StatusTab {
  label: string;
  value: ActivityApprovalStatus;
  icon: string;
}

interface SortOption {
  label: string;
  value: ActivityApprovalSortBy;
}

@Component({
  selector: 'app-activity-approval',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './activity-approval.component.html',
  styleUrl: './activity-approval.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityApprovalComponent implements OnInit, OnDestroy {
  private readonly approvalService = inject(ActivityApprovalService);
  private readonly alertService = inject(AlertService);
  private readonly confirmService = inject(ConfirmService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  readonly statusTabs: StatusTab[] = [
    { label: 'Chờ duyệt', value: 'PENDING', icon: 'bi-hourglass-split' },
    { label: 'Đã duyệt', value: 'APPROVED', icon: 'bi-check2-circle' },
    { label: 'Từ chối', value: 'REJECTED', icon: 'bi-x-circle' },
    { label: 'Tất cả', value: 'ALL', icon: 'bi-layers' },
  ];

  readonly sortOptions: SortOption[] = [
    { label: 'Cập nhật mới nhất', value: 'updatedAt' },
    { label: 'Ngày gửi', value: 'createdAt' },
    { label: 'Ngày tổ chức', value: 'startDate' },
    { label: 'Tên hoạt động', value: 'title' },
  ];

  readonly activities = signal<Activity[]>([]);
  readonly representatives = signal<ActivityRepresentativeLookup[]>([]);
  readonly keyword = signal('');
  readonly selectedStatus = signal<ActivityApprovalStatus>('PENDING');
  readonly selectedClassId = signal<number | null>(null);
  readonly sortBy = signal<ActivityApprovalSortBy>('updatedAt');
  readonly sortDirection = signal<ActivityApprovalSortDirection>('DESC');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalRows = signal(0);
  readonly totalPage = signal(0);
  readonly isLoading = signal(false);
  readonly isDetailLoading = signal(false);
  readonly processingId = signal<number | null>(null);
  readonly selectedActivity = signal<Activity | null>(null);
  readonly rejectingActivity = signal<Activity | null>(null);
  readonly rejectReason = signal('');
  readonly stats = signal({
    pendingReview: 0,
    approvedThisTerm: 0,
    rejected: 0,
  });

  readonly classOptions = computed(() =>
    this.approvalService.toClassOptions(this.representatives()),
  );

  readonly totalReviewable = computed(
    () => this.stats().pendingReview + this.stats().approvedThisTerm + this.stats().rejected,
  );

  readonly hasActiveFilter = computed(
    () =>
      this.keyword().trim().length > 0 ||
      this.selectedStatus() !== 'PENDING' ||
      this.selectedClassId() !== null,
  );

  private routeSubscription?: Subscription;
  private searchTimeout?: ReturnType<typeof setTimeout>;
  private detailRequestToken = 0;
  private previousBodyOverflow: string | null = null;
  private readonly cloudinaryUploadBaseUrl = 'https://res.cloudinary.com/dhjamvg6j/image/upload/';
  private readonly fallbackActivityImageUrl =
    'https://res.cloudinary.com/dhjamvg6j/image/upload/v1772505926/default_activity_coverImage.jpg';

  constructor() {
    effect(() => {
      this.setBodyScrollLocked(
        this.isDetailLoading() || !!this.selectedActivity() || !!this.rejectingActivity(),
      );
    });
  }

  ngOnInit(): void {
    this.routeSubscription = combineLatest([
      this.route.paramMap,
      this.route.queryParamMap,
    ]).subscribe(([params, query]) => {
      this.openActivityFromRoute(params.get('id') || query.get('activityId'));
    });
    this.loadRepresentatives();
    this.loadStats();
    this.loadActivities();
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.setBodyScrollLocked(false);
  }

  loadRepresentatives(): void {
    this.approvalService.getRepresentatives().subscribe({
      next: (representatives) => this.representatives.set(representatives),
      error: () => {
        this.representatives.set([]);
        this.alertService.warning('Không thể tải danh sách chi đoàn để lọc.');
      },
    });
  }

  loadStats(): void {
    this.approvalService
      .getStats({
        keyword: this.keyword(),
        classId: this.selectedClassId(),
      })
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: () =>
          this.stats.set({
            pendingReview: 0,
            approvedThisTerm: 0,
            rejected: 0,
          }),
      });
  }

  loadActivities(): void {
    this.isLoading.set(true);
    this.approvalService
      .getActivities({
        keyword: this.keyword(),
        status: this.selectedStatus(),
        classId: this.selectedClassId(),
        page: this.currentPage(),
        size: this.pageSize(),
        sortBy: this.sortBy(),
        sortDirection: this.sortDirection(),
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (page) => {
          this.activities.set(page?.data || []);
          this.totalRows.set(page?.totalRows || 0);
          this.totalPage.set(page?.totalPage || 0);
          this.pageSize.set(page?.pageSize || this.pageSize());
          this.currentPage.set(page?.pageNumber || this.currentPage());
        },
        error: (error: HttpErrorResponse) => {
          this.activities.set([]);
          this.totalRows.set(0);
          this.alertService.error(
            error.error?.message || 'Không thể tải danh sách hoạt động chờ duyệt.',
          );
        },
      });
  }

  refresh(): void {
    this.loadRepresentatives();
    this.loadStats();
    this.loadActivities();
    const activity = this.selectedActivity();
    if (activity) {
      this.loadActivityDetail(activity.id);
    }
  }

  onKeywordChange(value: string): void {
    this.keyword.set(value);
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => this.search(), 500);
  }

  search(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.currentPage.set(1);
    this.loadStats();
    this.loadActivities();
  }

  clearFilters(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.keyword.set('');
    this.selectedStatus.set('PENDING');
    this.selectedClassId.set(null);
    this.currentPage.set(1);
    this.loadStats();
    this.loadActivities();
  }

  changeStatus(status: ActivityApprovalStatus): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadActivities();
  }

  changeClass(classId: number | string | null): void {
    this.selectedClassId.set(classId ? Number(classId) : null);
    this.currentPage.set(1);
    this.loadStats();
    this.loadActivities();
  }

  changeSort(sortBy: ActivityApprovalSortBy): void {
    this.sortBy.set(sortBy);
    this.currentPage.set(1);
    this.loadActivities();
  }

  toggleSortDirection(): void {
    this.sortDirection.set(this.sortDirection() === 'DESC' ? 'ASC' : 'DESC');
    this.currentPage.set(1);
    this.loadActivities();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadActivities();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadActivities();
  }

  openDetail(activityId: number): void {
    void this.router.navigate(['/admin/org/approvals'], { queryParams: { activityId } });
  }

  closeDetail(): void {
    void this.router.navigate(['/admin/org/approvals']);
  }

  editActivity(activityId: number): void {
    void this.router.navigate(['/admin/org/activities/edit', activityId]);
  }

  approveActivity(activity: Activity): void {
    if (!this.canDecide(activity)) {
      return;
    }

    this.confirmService
      .success({
        title: 'Duyệt hoạt động?',
        message: `Hoạt động "${activity.title}" sẽ được công bố sau khi duyệt.`,
        confirmText: 'Duyệt hoạt động',
        cancelText: 'Xem lại',
      })
      .then(() => {
        this.processingId.set(activity.id);
        this.approvalService
          .approveActivity(activity.id)
          .pipe(finalize(() => this.processingId.set(null)))
          .subscribe({
            next: () => {
              this.alertService.success('Đã duyệt hoạt động.');
              this.reloadAfterDecision(activity.id);
            },
            error: (error: HttpErrorResponse) =>
              this.alertService.error(error.error?.message || 'Không thể duyệt hoạt động.'),
          });
      })
      .catch(() => undefined);
  }

  openReject(activity: Activity): void {
    if (!this.canDecide(activity)) {
      return;
    }
    this.rejectingActivity.set(activity);
    this.rejectReason.set('');
  }

  closeReject(): void {
    if (this.processingId()) {
      return;
    }
    this.rejectingActivity.set(null);
    this.rejectReason.set('');
  }

  submitReject(): void {
    const activity = this.rejectingActivity();
    const reason = this.rejectReason().trim();
    if (!activity || !reason) {
      this.alertService.warning('Vui lòng nhập lý do từ chối cụ thể.');
      return;
    }

    this.processingId.set(activity.id);
    this.approvalService
      .rejectActivity(activity.id, reason)
      .pipe(finalize(() => this.processingId.set(null)))
      .subscribe({
        next: () => {
          this.alertService.success('Đã từ chối hoạt động.');
          this.rejectingActivity.set(null);
          this.rejectReason.set('');
          this.reloadAfterDecision(activity.id);
        },
        error: (error: HttpErrorResponse) =>
          this.alertService.error(error.error?.message || 'Không thể từ chối hoạt động.'),
      });
  }

  canDecide(activity: Activity | null): boolean {
    return !!activity && activity.status === 0 && this.processingId() !== activity.id;
  }

  canEdit(activity: Activity | null): boolean {
    return !!activity && activity.status === 0 && this.processingId() !== activity.id;
  }

  tabCount(status: ActivityApprovalStatus): number {
    if (status === 'PENDING') return this.stats().pendingReview;
    if (status === 'APPROVED') return this.stats().approvedThisTerm;
    if (status === 'REJECTED') return this.stats().rejected;
    return this.totalReviewable();
  }

  statusLabel(status?: number | null): string {
    if (status === 0) return 'Chờ duyệt';
    if (status === 1) return 'Đã duyệt';
    if (status === 2) return 'Từ chối';
    if (status === 3) return 'Bản nháp';
    if (status === 4) return 'Đã hủy';
    return 'Đang cập nhật';
  }

  statusTone(status?: number | null): string {
    if (status === 0) return 'pending';
    if (status === 1) return 'approved';
    if (status === 2) return 'rejected';
    if (status === 3) return 'draft';
    if (status === 4) return 'cancelled';
    return 'neutral';
  }

  statusIcon(status?: number | null): string {
    if (status === 0) return 'bi-hourglass-split';
    if (status === 1) return 'bi-check2-circle';
    if (status === 2) return 'bi-x-circle';
    if (status === 3) return 'bi-pencil-square';
    if (status === 4) return 'bi-slash-circle';
    return 'bi-circle';
  }

  displayClass(activity: Activity): string {
    const creatorId = activity.createdBy?.id;
    if (!creatorId) {
      return 'Chưa xác định chi đoàn';
    }
    return this.studentClassMap().get(creatorId) || 'Chưa xác định chi đoàn';
  }

  displayCreator(activity: Activity): string {
    return (
      activity.createdBy?.fullName ||
      activity.createdBy?.username ||
      activity.organizer?.fullName ||
      'Đại diện chi đoàn'
    );
  }

  displayImage(activity: Activity): string {
    return this.toActivityImageUrl(activity.thumbnail || activity.coverImage);
  }

  onActivityImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (image && image.src !== this.fallbackActivityImageUrl) {
      image.src = this.fallbackActivityImageUrl;
    }
  }

  private toActivityImageUrl(value?: string | null): string {
    const imageUrl = value?.trim();
    if (!imageUrl) {
      return this.fallbackActivityImageUrl;
    }

    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('data:') ||
      imageUrl.startsWith('blob:')
    ) {
      return imageUrl;
    }

    return `${this.cloudinaryUploadBaseUrl}${imageUrl.replace(/^\/+/, '')}`;
  }

  activityLevelLabel(activity: Activity): string {
    if (activity.isExternal) return 'Ngoài trường';
    if (activity.isFaculty) return 'Cấp khoa';
    return 'Cấp trường';
  }

  formatDateTime(value?: string | Date | null): string {
    if (!value) {
      return 'Chưa cập nhật';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Chưa cập nhật';
    }
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private readonly studentClassMap = computed(() => {
    const map = new Map<number, string>();
    for (const representative of this.representatives()) {
      if (!representative.studentId || map.has(representative.studentId)) {
        continue;
      }
      map.set(representative.studentId, this.approvalService.buildClassLabel(representative));
    }
    return map;
  });

  private openActivityFromRoute(idParam: string | null): void {
    if (!idParam) {
      this.detailRequestToken += 1;
      this.selectedActivity.set(null);
      this.isDetailLoading.set(false);
      return;
    }

    const activityId = Number(idParam);
    if (!Number.isFinite(activityId) || activityId <= 0) {
      this.detailRequestToken += 1;
      this.selectedActivity.set(null);
      this.alertService.warning('Mã hoạt động không hợp lệ.');
      void this.router.navigate(['/admin/org/approvals']);
      return;
    }

    this.loadActivityDetail(activityId);
  }

  private loadActivityDetail(activityId: number): void {
    const requestToken = ++this.detailRequestToken;
    this.selectedActivity.set(null);
    this.isDetailLoading.set(true);
    this.approvalService
      .getActivityDetails(activityId)
      .pipe(
        finalize(() => {
          if (this.detailRequestToken === requestToken) {
            this.isDetailLoading.set(false);
          }
        }),
      )
      .subscribe({
        next: (activity) => {
          if (this.detailRequestToken !== requestToken) {
            return;
          }
          this.selectedActivity.set(activity);
        },
        error: (error: HttpErrorResponse) => {
          if (this.detailRequestToken !== requestToken) {
            return;
          }
          this.selectedActivity.set(null);
          this.alertService.error(error.error?.message || 'Không thể mở chi tiết hoạt động.');
          void this.router.navigate(['/admin/org/approvals']);
        },
      });
  }

  private reloadAfterDecision(activityId: number): void {
    this.loadStats();
    this.loadActivities();
    if (this.selectedActivity()?.id === activityId) {
      this.loadActivityDetail(activityId);
    }
  }

  private setBodyScrollLocked(isLocked: boolean): void {
    const { body } = this.document;
    if (!body) {
      return;
    }

    if (isLocked) {
      if (this.previousBodyOverflow === null) {
        this.previousBodyOverflow = body.style.overflow;
      }
      body.style.overflow = 'hidden';
      return;
    }

    if (this.previousBodyOverflow !== null) {
      body.style.overflow = this.previousBodyOverflow;
      this.previousBodyOverflow = null;
    }
  }
}
