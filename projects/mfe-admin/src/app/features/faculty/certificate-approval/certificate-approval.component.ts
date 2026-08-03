import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AlertService, CustomSelectComponent, PaginationComponent } from '@my-mfe/ui';
import { PageDTO, Semester } from '@my-mfe/interface';
import { CategoryResponse } from '../../../shared/models/category.model';
import { CategoryService } from '../services/category.service';
import {
  CertificateApprovalService,
  CertificateSubmission,
  CertificateSubmissionStatus,
} from '../services/certificate-approval.service';

interface StatusOption {
  label: string;
  value: CertificateSubmissionStatus | null;
}

interface CategoryOption {
  category: CategoryResponse;
  depth: number;
  label: string;
  description: string;
}

@Component({
  selector: 'app-certificate-approval',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, PaginationComponent],
  templateUrl: './certificate-approval.component.html',
  styleUrl: './certificate-approval.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateApprovalComponent implements OnInit {
  private certificateService = inject(CertificateApprovalService);
  private categoryService = inject(CategoryService);
  private alertService = inject(AlertService);
  private route = inject(ActivatedRoute);

  readonly statusOptions: StatusOption[] = [
    { label: 'Chờ duyệt', value: 0 },
    { label: 'Đã duyệt', value: 1 },
    { label: 'Bị từ chối', value: 2 },
    { label: 'Tất cả', value: null },
  ];

  submissions = signal<CertificateSubmission[]>([]);
  semesters = signal<Semester[]>([]);
  categoryTree = signal<CategoryResponse[]>([]);
  selectedStatus = signal<CertificateSubmissionStatus | null>(0);
  selectedSemesterId = signal<number | null>(null);
  keyword = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  totalRows = signal(0);
  statusTotals = signal({ pending: 0, approved: 0, rejected: 0 });

  isLoading = signal(false);
  processingId = signal<number | null>(null);
  detailSubmission = signal<CertificateSubmission | null>(null);
  approvingSubmission = signal<CertificateSubmission | null>(null);
  rejectingSubmission = signal<CertificateSubmission | null>(null);

  reviewCategoryId = signal<number | null>(null);
  reviewPoint = signal<number | null>(null);
  reviewCertificateTitle = signal('');
  reviewAchievement = signal('');
  reviewNote = signal('');
  rejectReason = signal('');

  readonly pendingCount = computed(() => this.statusTotals().pending);
  readonly approvedCount = computed(() => this.statusTotals().approved);
  readonly rejectedCount = computed(() => this.statusTotals().rejected);
  readonly totalCount = computed(
    () => this.pendingCount() + this.approvedCount() + this.rejectedCount(),
  );
  readonly categoryOptions = computed(() => this.flattenCategoryOptions(this.categoryTree()));
  readonly reviewCategoryOptions = computed(() =>
    this.categoryOptions().map((option) => ({
      value: option.category.id,
      label: option.category.name,
      description: option.description,
      icon: 'bi-award',
    })),
  );
  readonly selectedCategory = computed(
    () =>
      this.categoryOptions().find((option) => option.category.id === this.reviewCategoryId())
        ?.category || null,
  );
  readonly approvalInvalid = computed(() => {
    const category = this.selectedCategory();
    const point = this.reviewPoint();
    if (!this.approvingSubmission() || !category || point == null || point < 0) return true;
    return category.maxPoint > 0 && point > category.maxPoint;
  });

  ngOnInit(): void {
    this.applyDeepLinkStatus(this.route.snapshot.queryParamMap.get('status'));
    this.loadReferenceData();
    this.loadStatusTotals();
    this.loadSubmissions();
  }

  loadReferenceData(): void {
    this.certificateService.getSemesters().subscribe({
      next: (res) => {
        const semesters = res.data || [];
        this.semesters.set(semesters);
        const active = semesters.find((semester) => semester.isActive);
        this.selectedSemesterId.set(active?.id ?? null);
        this.loadStatusTotals();
        this.loadSubmissions();
      },
      error: () => this.semesters.set([]),
    });

    this.categoryService.getAllCategoriesTree(true).subscribe({
      next: (res) => this.categoryTree.set(res.data || []),
      error: () => {
        this.categoryTree.set([]);
        this.alertService.error('Không thể tải danh mục điểm rèn luyện.');
      },
    });
  }

  loadSubmissions(): void {
    this.isLoading.set(true);
    this.certificateService
      .getSubmissions({
        status: this.selectedStatus(),
        semesterId: this.selectedSemesterId(),
        keyword: this.keyword(),
        page: this.currentPage(),
        size: this.pageSize(),
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const page = res.data as PageDTO<CertificateSubmission> | undefined;
          this.submissions.set(page?.data || []);
          this.totalRows.set(page?.totalRows || 0);
          this.pageSize.set(page?.pageSize || this.pageSize());
          this.currentPage.set(page?.pageNumber != null ? page.pageNumber + 1 : this.currentPage());
        },
        error: (err) => {
          this.submissions.set([]);
          this.totalRows.set(0);
          this.alertService.error(err.error?.message || 'Không thể tải danh sách giấy khen.');
        },
      });
  }

  loadStatusTotals(): void {
    const semesterId = this.selectedSemesterId();
    const keyword = this.keyword();
    forkJoin({
      pending: this.certificateService
        .getSubmissions({ semesterId, keyword, status: 0, page: 1, size: 1 })
        .pipe(catchError(() => of(null))),
      approved: this.certificateService
        .getSubmissions({ semesterId, keyword, status: 1, page: 1, size: 1 })
        .pipe(catchError(() => of(null))),
      rejected: this.certificateService
        .getSubmissions({ semesterId, keyword, status: 2, page: 1, size: 1 })
        .pipe(catchError(() => of(null))),
    }).subscribe(({ pending, approved, rejected }) => {
      this.statusTotals.set({
        pending: pending?.data?.totalRows || 0,
        approved: approved?.data?.totalRows || 0,
        rejected: rejected?.data?.totalRows || 0,
      });
    });
  }

  changeStatus(status: CertificateSubmissionStatus | null): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadSubmissions();
  }

  statusCount(status: CertificateSubmissionStatus | null): number {
    if (status === 0) return this.pendingCount();
    if (status === 1) return this.approvedCount();
    if (status === 2) return this.rejectedCount();
    return this.totalCount();
  }

  selectSemester(semesterId: number | null): void {
    this.selectedSemesterId.set(semesterId);
    this.currentPage.set(1);
    this.loadStatusTotals();
    this.loadSubmissions();
  }

  search(): void {
    this.currentPage.set(1);
    this.loadStatusTotals();
    this.loadSubmissions();
  }

  clearSearch(): void {
    this.keyword.set('');
    this.search();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadSubmissions();
  }

  onSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadSubmissions();
  }

  openDetail(submission: CertificateSubmission): void {
    this.detailSubmission.set(submission);
  }

  closeDetail(): void {
    this.detailSubmission.set(null);
  }

  openApprove(submission: CertificateSubmission): void {
    this.detailSubmission.set(null);
    this.approvingSubmission.set(submission);
    const suggestedCategory = this.categoryOptions().find(
      (option) => option.category.id === submission.suggestedCategoryId,
    );
    this.reviewCategoryId.set(suggestedCategory?.category.id ?? null);
    this.reviewPoint.set(submission.suggestedPoint ?? null);
    this.reviewCertificateTitle.set(submission.certificateTitle || '');
    this.reviewAchievement.set(submission.achievement || '');
    this.reviewNote.set(submission.suggestionReason || '');
  }

  closeApprove(force = false): void {
    if (this.processingId() && !force) return;
    this.approvingSubmission.set(null);
    this.reviewCategoryId.set(null);
    this.reviewPoint.set(null);
    this.reviewCertificateTitle.set('');
    this.reviewAchievement.set('');
    this.reviewNote.set('');
  }

  submitApprove(): void {
    const submission = this.approvingSubmission();
    const category = this.selectedCategory();
    const point = this.reviewPoint();
    if (!submission || !category || point == null) return;
    if (this.approvalInvalid()) {
      this.alertService.error('Vui lòng kiểm tra tiêu chí và điểm được duyệt.');
      return;
    }

    this.processingId.set(submission.id);
    this.certificateService
      .approve(submission.id, {
        approvedCategoryId: category.id,
        approvedPoint: point,
        certificateTitle: this.reviewCertificateTitle().trim() || null,
        achievement: this.reviewAchievement().trim() || null,
        reviewNote: this.reviewNote().trim() || null,
      })
      .pipe(finalize(() => this.processingId.set(null)))
      .subscribe({
        next: () => {
          this.alertService.success('Đã duyệt giấy khen và ghi nhận điểm.');
          this.processingId.set(null);
          this.closeApprove(true);
          this.closeDetail();
          this.loadStatusTotals();
          this.loadSubmissions();
        },
        error: (err) => this.alertService.error(err.error?.message || 'Không thể duyệt giấy khen.'),
      });
  }

  setReviewCategoryValue(value: number | string | boolean | null): void {
    if (value === null || value === '') {
      this.reviewCategoryId.set(null);
      return;
    }

    const parsed = Number(value);
    this.reviewCategoryId.set(Number.isFinite(parsed) ? parsed : null);
  }

  openReject(submission: CertificateSubmission): void {
    this.detailSubmission.set(null);
    this.rejectingSubmission.set(submission);
    this.rejectReason.set(submission.rejectionReason || '');
  }

  closeReject(force = false): void {
    if (this.processingId() && !force) return;
    this.rejectingSubmission.set(null);
    this.rejectReason.set('');
  }

  submitReject(): void {
    const submission = this.rejectingSubmission();
    const reason = this.rejectReason().trim();
    if (!submission || !reason) return;

    this.processingId.set(submission.id);
    this.certificateService
      .reject(submission.id, { reason })
      .pipe(finalize(() => this.processingId.set(null)))
      .subscribe({
        next: () => {
          this.alertService.success('Đã từ chối giấy khen.');
          this.processingId.set(null);
          this.closeReject(true);
          this.closeDetail();
          this.loadStatusTotals();
          this.loadSubmissions();
        },
        error: (err) =>
          this.alertService.error(err.error?.message || 'Không thể từ chối giấy khen.'),
      });
  }

  setReviewPoint(value: number | string | null): void {
    if (value === null || value === '') {
      this.reviewPoint.set(null);
      return;
    }
    const point = Number(value);
    this.reviewPoint.set(Number.isFinite(point) ? point : null);
  }

  canApprove(submission: CertificateSubmission): boolean {
    return submission.status === 0 || submission.status === 2;
  }

  canReject(submission: CertificateSubmission): boolean {
    return submission.status === 0;
  }

  statusLabel(status: number | null | undefined): string {
    if (status === 1) return 'Đã duyệt';
    if (status === 2) return 'Bị từ chối';
    if (status === 3) return 'Đã hủy';
    return 'Chờ duyệt';
  }

  statusTone(status: number | null | undefined): string {
    if (status === 1) return 'success';
    if (status === 2) return 'danger';
    if (status === 3) return 'muted';
    return 'warning';
  }

  displayTitle(submission: CertificateSubmission): string {
    return submission.certificateTitle || submission.achievement || 'Giấy khen chưa xác định';
  }

  displayStudent(submission: CertificateSubmission): string {
    return (
      [submission.studentCode, submission.studentName].filter(Boolean).join(' - ') ||
      `SV #${submission.studentId || 'N/A'}`
    );
  }

  displayExtractedStudent(submission: CertificateSubmission): string {
    return (
      [submission.extractedStudentCode, submission.extractedStudentName]
        .filter(Boolean)
        .join(' - ') || 'AI chưa nhận diện rõ'
    );
  }

  formatConfidence(value: number | null | undefined): string {
    if (value == null) return 'Chưa có';
    const percent = value <= 1 ? value * 100 : value;
    return `${Math.round(percent)}%`;
  }

  formatSemesterLabel(semester: Semester): string {
    return `${semester.semesterName} (${semester.academicYear})`;
  }

  getCategoryMaxLabel(): string {
    const category = this.selectedCategory();
    if (!category) return 'Chọn tiêu chí để xem mức điểm tối đa';
    return category.maxPoint > 0
      ? `Tối đa ${category.maxPoint} điểm`
      : 'Không giới hạn điểm tối đa';
  }

  trackSubmission(_: number, submission: CertificateSubmission): number {
    return submission.id;
  }

  trackCategory(_: number, option: CategoryOption): number {
    return option.category.id;
  }

  private applyDeepLinkStatus(statusParam: string | null): void {
    if (statusParam === null || statusParam === 'all') {
      this.selectedStatus.set(null);
      return;
    }

    const parsed = Number(statusParam);
    this.selectedStatus.set(Number.isNaN(parsed) ? null : (parsed as CertificateSubmissionStatus));
  }

  private flattenCategoryOptions(nodes: CategoryResponse[], depth = 0): CategoryOption[] {
    return nodes.flatMap((category) => {
      const children = this.flattenCategoryOptions(category.children || [], depth + 1);
      const isLeaf = children.length === 0;
      const current: CategoryOption[] = isLeaf
        ? [
            {
              category,
              depth,
              label: category.name,
              description: this.buildCategoryDescription(category),
            },
          ]
        : [];
      return [...current, ...children];
    });
  }

  private buildCategoryDescription(category: CategoryResponse): string {
    const parts: string[] = [];
    if (category.code) {
      parts.push(`[${category.code}]`);
    }
    parts.push(category.maxPoint > 0 ? `Tối đa ${category.maxPoint} điểm` : 'Không giới hạn điểm');
    return parts.join(' · ');
  }
}
