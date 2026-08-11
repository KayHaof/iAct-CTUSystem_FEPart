import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, Location, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import {
  ApiResponse,
  normalizeApiUtcDateTime,
  normalizeRegistrationDateFields,
} from '@my-mfe/interface';

import {
  PaginationComponent,
  AlertService,
  ConfirmService,
  ConfirmDialogComponent,
  TableContainerComponent,
  CustomSelectComponent,
  IACT_API_ORIGIN,
} from '@my-mfe/ui';
import { CloudinaryPathPipe } from '@my-mfe/data-access-media';
import { ParticipantService } from '../services/participant.service';
import { RegistrationResponse } from '@my-mfe/interface';
import { PageDTO } from '@my-mfe/interface';
import { ActivityComplaintsComponent } from './activity-complaints/activity-complaints.component';
import { ActivityProofsComponent } from './activity-proofs/activity-proofs.component';

type ParticipantView = 'PARTICIPANTS' | 'PROOFS' | 'ABSENCES' | 'COMPLAINTS';
type ParticipantTab = 'ALL' | '0' | '1' | '2' | '3' | 'NEEDS_PROCESSING';
type AbsenceReviewFilter = 'PENDING' | 'REVIEWED' | 'ALL';

interface ActivityTimingResponse {
  startDate?: string | null;
  endDate?: string | null;
}

type DepartmentRegistration = RegistrationResponse & {
  absenceReason?: string;
  absenceReviewed?: boolean;
  absenceReviewedAt?: string;
  absenceReviewNote?: string;
  registeredSessionCount?: number;
  faceVerifiedSessionCount?: number;
  absentSessionCount?: number;
  point?: number;
};

interface ParticipantFilterTab {
  label: string;
  value: ParticipantTab;
  icon: string;
  tone: 'slate' | 'sky' | 'emerald' | 'amber' | 'rose';
}

@Component({
  selector: 'app-participant-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent,
    TableContainerComponent,
    NgOptimizedImage,
    CloudinaryPathPipe,
    ConfirmDialogComponent,
    ActivityComplaintsComponent,
    ActivityProofsComponent,
    CustomSelectComponent,
  ],
  templateUrl: './participant-management.component.html',
  styleUrl: './participant-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private participantService = inject(ParticipantService);
  private alertService = inject(AlertService);
  private confirmService = inject(ConfirmService);
  private http = inject(HttpClient);
  private readonly apiOrigin = inject(IACT_API_ORIGIN);
  private readonly registrationApi = `${this.apiOrigin}/activity/api/v1/registrations`;

  activityId = signal<number | null>(null);

  // --- QUẢN LÝ TRẠNG THÁI ---
  searchQuery = signal('');
  selectedAcademicYear = signal('');
  academicYears = signal<string[]>([]);
  activeView = signal<ParticipantView>('PARTICIPANTS');
  currentTab = signal<ParticipantTab>('ALL');
  currentPage = signal(1);
  pageSize = signal(10);
  isLoading = signal(false);

  totalRows = signal(0);
  proofTotalRows = signal(0);
  absenceTotalRows = signal(0);
  complaintTotalRows = signal(0);
  participants = signal<RegistrationResponse[]>([]);
  activityEndDate = signal<Date | null>(null);
  absentParticipants = signal<DepartmentRegistration[]>([]);
  absenceLoading = signal(false);
  absencePage = signal(1);
  absencePageSize = signal(10);
  absenceReviewFilter = signal<AbsenceReviewFilter>('PENDING');
  absenceReviewTarget = signal<DepartmentRegistration | null>(null);
  absenceReviewNote = signal('');

  readonly absenceReviewOptions = [
    { label: 'Chưa xử lý', value: 'PENDING', icon: 'bi-hourglass-split' },
    { label: 'Đã xử lý', value: 'REVIEWED', icon: 'bi-check2-circle' },
    { label: 'Tất cả', value: 'ALL', icon: 'bi-grid-3x3-gap' },
  ];

  readonly participantTabs: ParticipantFilterTab[] = [
    { label: 'Tất cả', value: 'ALL', icon: 'bi-grid-3x3-gap', tone: 'slate' },
    { label: 'Đã đăng ký', value: '0', icon: 'bi-person-plus', tone: 'sky' },
    { label: 'Đã điểm danh', value: '1', icon: 'bi-check2-circle', tone: 'emerald' },
    { label: 'Cần xử lý', value: 'NEEDS_PROCESSING', icon: 'bi-exclamation-triangle', tone: 'amber' },
    { label: 'Vắng mặt', value: '3', icon: 'bi-person-x', tone: 'rose' },
    { label: 'Đã hủy', value: '2', icon: 'bi-x-circle', tone: 'rose' },
  ];

  currentTabLabel = computed(
    () => this.participantTabs.find((tab) => tab.value === this.currentTab())?.label || 'Danh sách',
  );
  canExportCurrentTab = computed(
    () =>
      this.currentTab() === '0' ||
      this.currentTab() === '3' ||
      (this.currentTab() === 'NEEDS_PROCESSING' && this.isActivityEnded()),
  );
  exportButtonTitle = computed(() =>
    this.canExportCurrentTab()
      ? `Xuất danh sách ${this.currentTabLabel().toLowerCase()}`
      : 'Chỉ xuất Excel ở tab Đã đăng ký, Cần xử lý hoặc Vắng mặt',
  );
  cohortOptions = computed(() => [
    {
      label: 'Tất cả khóa',
      value: '',
      icon: 'bi-mortarboard',
    },
    ...this.academicYears().map((year) => ({
      label: this.displayCohortLabel(year),
      value: year,
      icon: 'bi-mortarboard',
    })),
  ]);

  // --- QUẢN LÝ SORT CLIENT ---
  sortColumn = signal<keyof RegistrationResponse | ''>(''); // Cột đang sort
  sortDirection = signal<'asc' | 'desc'>('asc'); // Chiều sort

  private searchTimeout?: ReturnType<typeof setTimeout>;

  sortedParticipants = computed(() => {
    const data = [...this.visibleParticipants()];
    const col = this.sortColumn();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    if (!col) return data;

    return data.sort((a, b) => {
      const valA = this.getSortableValue(a, col);
      const valB = this.getSortableValue(b, col);

      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB, 'vi', { sensitivity: 'base' }) * dir;
      }

      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
  });

  private getSortableValue(
    item: RegistrationResponse,
    column: keyof RegistrationResponse,
  ): string | number | boolean {
    const value = item[column];

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    return '';
  }
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const viewParam = this.route.snapshot.queryParamMap.get('view');
    if (idParam) {
      this.activityId.set(Number(idParam));
      this.applyDeepLink(viewParam);
      this.loadAcademicYears();
      this.loadActivityTiming();
      if (this.activeView() === 'ABSENCES') {
        this.loadAbsences();
      }
    } else {
      this.alertService.error('Không tìm thấy mã hoạt động!');
      this.goBack();
    }
  }

  private loadActivityTiming(): void {
    const actId = this.activityId();
    if (!actId) {
      this.fetchParticipants();
      return;
    }

    this.http
      .get<ApiResponse<ActivityTimingResponse>>(
        this.apiOrigin + '/activity/api/v1/activities/' + actId + '/times-location',
      )
      .subscribe({
        next: (response) => {
          const endDateValue = normalizeApiUtcDateTime(response.data?.endDate);
          const endDate = endDateValue ? new Date(endDateValue) : null;
          this.activityEndDate.set(endDate && !Number.isNaN(endDate.getTime()) ? endDate : null);
          this.fetchParticipants();
        },
        error: () => {
          this.activityEndDate.set(null);
          this.fetchParticipants();
        },
      });
  }

  fetchParticipants(): void {
    const actId = this.activityId();
    if (!actId) return;

    const isNeedsTab = this.currentTab() === 'NEEDS_PROCESSING';
    this.isLoading.set(true);
    this.participantService
      .getParticipantsByActivity(
        actId,
        this.searchQuery(),
        this.participantQueryStatus(),
        this.selectedAcademicYear(),
        isNeedsTab ? 1 : this.currentPage(),
        isNeedsTab ? 1000 : this.pageSize(),
      )
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response: ApiResponse<PageDTO<RegistrationResponse>>) => {
          const pageData = response.data;
          this.participants.set(
            (pageData?.data || []).map((item) => normalizeRegistrationDateFields(item)),
          );
          this.totalRows.set(pageData?.totalRows || 0);

          // Reset sort khi load data mới
          this.sortColumn.set('');
          this.sortDirection.set('asc');
        },
        error: (err: HttpErrorResponse) => {
          this.alertService.error(err.error?.message || 'Lỗi tải danh sách sinh viên!');
        },
      });
  }

  loadAcademicYears(): void {
    const actId = this.activityId();
    if (!actId) return;

    this.participantService.getParticipantAcademicYears(actId).subscribe({
      next: (response) => {
        this.academicYears.set(response.data || []);
        if (this.selectedAcademicYear() && !this.academicYears().includes(this.selectedAcademicYear())) {
          this.selectedAcademicYear.set('');
        }
      },
      error: () => {
        this.academicYears.set([]);
      },
    });
  }

  // --- ACTIONS ---
  goBack(): void {
    this.location.back();
  }

  onTabChange(tab: ParticipantTab): void {
    this.currentTab.set(tab);
    this.currentPage.set(1);
    this.fetchParticipants();
  }

  onAcademicYearChange(value: number | string | boolean | null): void {
    this.selectedAcademicYear.set(typeof value === 'string' ? value : '');
    this.currentPage.set(1);
    this.fetchParticipants();
  }

  setActiveView(view: ParticipantView): void {
    this.activeView.set(view);
    if (view === 'ABSENCES') {
      this.absencePage.set(1);
      this.loadAbsences();
    }
  }

  loadAbsences(): void {
    const actId = this.activityId();
    if (!actId) return;

    let params = new HttpParams()
      .set('activityId', String(actId))
      .set('page', String(this.absencePage() - 1))
      .set('size', String(this.absencePageSize()));

    const reviewFilter = this.absenceReviewFilter();
    if (reviewFilter !== 'ALL') {
      params = params.set('reviewed', String(reviewFilter === 'REVIEWED'));
    }

    this.absenceLoading.set(true);
    this.http
      .get<ApiResponse<PageDTO<DepartmentRegistration>>>(`${this.registrationApi}/absent`, { params })
      .pipe(finalize(() => this.absenceLoading.set(false)))
      .subscribe({
        next: (response) => {
          const pageData = response.data;
          this.absentParticipants.set(
            (pageData?.data || []).map((item) => normalizeRegistrationDateFields(item)),
          );
          this.absenceTotalRows.set(pageData?.totalRows || 0);
        },
        error: (err: HttpErrorResponse) => {
          this.absentParticipants.set([]);
          this.absenceTotalRows.set(0);
          this.alertService.error(err.error?.message || 'Không thể tải danh sách sinh viên vắng mặt.');
        },
      });
  }

  onAbsenceReviewFilterChange(value: number | string | boolean | null): void {
    const filter = value === 'REVIEWED' || value === 'ALL' ? value : 'PENDING';
    this.absenceReviewFilter.set(filter);
    this.absencePage.set(1);
    this.loadAbsences();
  }

  onAbsencePageChange(page: number): void {
    this.absencePage.set(page);
    this.loadAbsences();
  }

  onAbsenceSizeChange(size: number): void {
    this.absencePageSize.set(size);
    this.absencePage.set(1);
    this.loadAbsences();
  }

  openAbsenceReview(item: DepartmentRegistration): void {
    this.absenceReviewTarget.set(item);
    this.absenceReviewNote.set(item.absenceReviewNote || '');
  }

  closeAbsenceReview(): void {
    this.absenceReviewTarget.set(null);
    this.absenceReviewNote.set('');
  }

  submitAbsenceReview(): void {
    const item = this.absenceReviewTarget();
    if (!item) return;

    this.absenceLoading.set(true);
    this.http
      .put<ApiResponse<DepartmentRegistration>>(`${this.registrationApi}/${item.id}/absence-review`, {
        note: this.absenceReviewNote().trim() || null,
      })
      .pipe(finalize(() => this.absenceLoading.set(false)))
      .subscribe({
        next: () => {
          this.alertService.success('Đã ghi nhận xử lý trường hợp vắng mặt.');
          this.closeAbsenceReview();
          this.loadAbsences();
        },
        error: (err: HttpErrorResponse) =>
          this.alertService.error(err.error?.message || 'Không thể ghi nhận xử lý vắng mặt.'),
      });
  }

  onSearch(keyword: string): void {
    this.searchQuery.set(keyword);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.fetchParticipants();
    }, 1000);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.fetchParticipants();
  }

  onSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.fetchParticipants();
  }

  toggleSort(column: keyof RegistrationResponse): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  private applyDeepLink(viewParam: string | null): void {
    if (viewParam === 'proofs') {
      this.activeView.set('PROOFS');
      return;
    }

    if (viewParam === 'complaints') {
      this.activeView.set('COMPLAINTS');
      return;
    }

    if (viewParam === 'absences') {
      this.activeView.set('ABSENCES');
      return;
    }

    if (viewParam === 'participants') {
      this.activeView.set('PARTICIPANTS');
    }
  }

  async changeStatus(
    id: number,
    newStatus: number,
    actionName: string,
    processViolation = false,
  ): Promise<void> {
    try {
      await this.confirmService.confirm({
        title: `Xác nhận ${actionName}?`,
        message: `Bạn có chắc chắn muốn ${actionName.toLowerCase()} sinh viên này không?`,
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
        type: newStatus === 2 ? 'danger' : 'warning',
        onConfirm: () => this.updateParticipantStatus(id, newStatus, actionName, processViolation),
      });
    } catch {
      // User cancelled.
    }
  }
  private updateParticipantStatus(
    id: number,
    newStatus: number,
    actionName: string,
    processViolation: boolean,
  ): void {
    this.isLoading.set(true);
    this.participantService
      .updateParticipantStatus(id, newStatus, processViolation)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.alertService.success(`Đã ${actionName.toLowerCase()} thành công!`);
          this.fetchParticipants();
        },
        error: (err: HttpErrorResponse) =>
          this.alertService.error(err.error?.message || 'Có lỗi xảy ra!'),
      });
  }

  getInitial(name: string): string {
    if (!name) return 'S';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  }

  exportToExcel(): void {
    const actId = this.activityId();
    if (!actId) return;
    if (!this.canExportCurrentTab()) {
      this.alertService.warning('Chỉ xuất Excel ở tab Đã đăng ký, Cần xử lý hoặc Vắng mặt.');
      return;
    }

    this.isLoading.set(true);
    this.participantService
      .exportExcel(actId, this.searchQuery(), this.participantQueryStatus(), this.selectedAcademicYear())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (blob: Blob) => {
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${this.exportFilePrefix()}_${actId}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(downloadUrl);

          this.alertService.success('Đã xuất file Excel thành công!');
        },
        error: () => {
          this.alertService.error('Có lỗi xảy ra khi tải file Excel!');
        },
      });
  }

  participantStatusLabel(item: RegistrationResponse): string {
    if (this.isNeedsProcessingRegistration(item)) return 'Cần xử lý';
    if (item.status === 0) return 'Đã đăng ký';
    if (item.status === 1) return 'Đã tham gia';
    if (item.status === 2) return 'Đã hủy';
    if (item.status === 3) return 'Vắng mặt';
    return 'Đang cập nhật';
  }

  displayCohortLabel(academicYear: string | null | undefined): string {
    const value = (academicYear || '').trim();
    if (!value) return 'Chưa có khóa';
    if (/^K\d+/i.test(value)) return value.toUpperCase();

    const year = Number(value.match(/\d{4}/)?.[0]);
    if (Number.isFinite(year) && year >= 1975) {
      return `K${year - 1974}`;
    }

    return value;
  }

  participantStatusIcon(item: RegistrationResponse): string {
    if (this.isNeedsProcessingRegistration(item)) return 'bi-exclamation-triangle';
    if (item.status === 0) return 'bi-hourglass-split';
    if (item.status === 1) return 'bi-check2-circle';
    if (item.status === 2) return 'bi-x-circle';
    if (item.status === 3) return 'bi-person-x';
    return 'bi-circle';
  }

  participantStatusTone(item: RegistrationResponse): string {
    if (this.isNeedsProcessingRegistration(item)) return 'needs-processing';
    if (item.status === 0) return 'registered';
    if (item.status === 1) return 'attended';
    if (item.status === 2) return 'cancelled';
    if (item.status === 3) return 'absent';
    return 'neutral';
  }

  isNeedsProcessingRegistration(item: RegistrationResponse): boolean {
    if (this.currentTab() !== 'NEEDS_PROCESSING' || !this.isActivityEnded()) {
      return false;
    }

    return item.status === 0 && !item.isAttended && !item.attendedAt;
  }

  needsProcessingParticipants = computed(() => {
    const participants = this.participants();
    return this.currentTab() === 'NEEDS_PROCESSING'
      ? participants.filter((item) => this.isNeedsProcessingRegistration(item))
      : [];
  });

  visibleParticipants = computed(() => {
    if (this.currentTab() !== 'NEEDS_PROCESSING') {
      return this.participants();
    }

    const start = (this.currentPage() - 1) * this.pageSize();
    return this.needsProcessingParticipants().slice(start, start + this.pageSize());
  });

  displayedTotalRows = computed(() =>
    this.currentTab() === 'NEEDS_PROCESSING'
      ? this.needsProcessingParticipants().length
      : this.totalRows(),
  );

  private isActivityEnded(): boolean {
    const endDate = this.activityEndDate();
    return !!endDate && new Date() > endDate;
  }

  private participantQueryStatus(): string {
    return this.currentTab() === 'NEEDS_PROCESSING' ? '0' : this.currentTab();
  }

  private exportFilePrefix(): string {
    if (this.currentTab() === 'NEEDS_PROCESSING') return 'Danh_sach_Can_xu_ly';
    if (this.currentTab() === '3') return 'Danh_sach_Vang_mat';
    return 'Danh_sach_Da_dang_ky';
  }
}
