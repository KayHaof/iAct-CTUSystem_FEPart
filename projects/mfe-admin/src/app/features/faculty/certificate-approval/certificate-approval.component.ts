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
import {
  CertificateSubmissionComplaint,
  CertificateSubmissionComplaintService,
  CertificateSubmissionComplaintStatus,
} from '../services/certificate-submission-complaint.service';

interface StatusOption {
  label: string;
  value: CertificateSubmissionStatus | null;
  icon: string;
  tone: 'all' | 'pending' | 'approved' | 'rejected';
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
  private complaintService = inject(CertificateSubmissionComplaintService);
  private categoryService = inject(CategoryService);
  private alertService = inject(AlertService);
  private route = inject(ActivatedRoute);

  readonly statusOptions: StatusOption[] = [
    { label: 'Tất cả', value: null, icon: 'bi-grid-3x3-gap', tone: 'all' },
    { label: 'Chờ duyệt', value: 0, icon: 'bi-hourglass-split', tone: 'pending' },
    { label: 'Đã duyệt', value: 1, icon: 'bi-check2-circle', tone: 'approved' },
    { label: 'Bị từ chối', value: 2, icon: 'bi-x-circle', tone: 'rejected' },
  ];

  readonly complaintStatusOptions = [
    { value: 0, label: 'Chờ xử lý', icon: 'bi-hourglass-split' },
    { value: 1, label: 'Đã duyệt', icon: 'bi-check2-circle' },
    { value: 2, label: 'Bị từ chối', icon: 'bi-x-circle' },
    { value: null, label: 'Tất cả', icon: 'bi-list-ul' },
  ];

  submissions = signal<CertificateSubmission[]>([]);
  complaints = signal<CertificateSubmissionComplaint[]>([]);
  semesters = signal<Semester[]>([]);
  categoryTree = signal<CategoryResponse[]>([]);
  activeView = signal<'submissions' | 'complaints'>('submissions');
  selectedStatus = signal<CertificateSubmissionStatus | null>(0);
  selectedComplaintStatus = signal<CertificateSubmissionComplaintStatus | null>(0);
  selectedSemesterId = signal<number | null>(null);
  keyword = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  totalRows = signal(0);
  statusTotals = signal({ pending: 0, approved: 0, rejected: 0 });
  complaintTotals = signal({ pending: 0, approved: 0, rejected: 0 });

  isLoading = signal(false);
  processingId = signal<number | null>(null);
  detailSubmission = signal<CertificateSubmission | null>(null);
  approvingSubmission = signal<CertificateSubmission | null>(null);
  rejectingSubmission = signal<CertificateSubmission | null>(null);
  detailComplaint = signal<CertificateSubmissionComplaint | null>(null);
  approvingComplaint = signal<CertificateSubmissionComplaint | null>(null);
  rejectingComplaint = signal<CertificateSubmissionComplaint | null>(null);

  reviewCategoryId = signal<number | null>(null);
  reviewPoint = signal<number | null>(null);
  reviewCertificateTitle = signal('');
  reviewAchievement = signal('');
  reviewNote = signal('');
  rejectReason = signal('');

  readonly pendingCount = computed(() => this.statusTotals().pending);
  readonly approvedCount = computed(() => this.statusTotals().approved);
  readonly rejectedCount = computed(() => this.statusTotals().rejected);
  readonly complaintPendingCount = computed(() => this.complaintTotals().pending);
  readonly totalCount = computed(
    () => this.pendingCount() + this.approvedCount() + this.rejectedCount(),
  );
  readonly isComplaintView = computed(() => this.activeView() === 'complaints');
  readonly semesterOptions = computed(() => [
    { value: null, label: 'Tất cả học kỳ', icon: 'bi-calendar3' },
    ...this.semesters().map((semester) => ({
      value: semester.id,
      label: this.formatSemesterLabel(semester),
      icon: semester.isActive ? 'bi-check-circle' : 'bi-calendar3',
    })),
  ]);
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
    if (
      (!this.approvingSubmission() && !this.approvingComplaint()) ||
      !category ||
      point == null ||
      point < 0
    ) {
      return true;
    }
    return category.maxPoint > 0 && point > category.maxPoint;
  });

  ngOnInit(): void {
    this.applyDeepLinkStatus(this.route.snapshot.queryParamMap.get('status'));
    this.loadReferenceData();
    this.loadStatusTotals();
    this.loadComplaintTotals();
    this.loadCurrentPage();
  }

  loadReferenceData(): void {
    this.certificateService.getSemesters().subscribe({
      next: (res) => {
        const semesters = res.data || [];
        this.semesters.set(semesters);
        const active = semesters.find((semester) => semester.isActive);
        this.selectedSemesterId.set(active?.id ?? null);
        this.loadStatusTotals();
        this.loadComplaintTotals();
        this.loadCurrentPage();
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

  loadCurrentPage(): void {
    if (this.isComplaintView()) {
      this.loadComplaints();
      return;
    }

    this.loadSubmissions();
  }

  loadSubmissions(): void {
    this.isLoading.set(true);
    this.certificateService
      .getSubmissions({
        status: this.selectedStatus(),
        semesterId: this.selectedSemesterId(),
        keyword: this.keyword(),
        excludeAutoRejected: true,
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

  loadComplaints(): void {
    this.isLoading.set(true);
    this.complaintService
      .getComplaints({
        status: this.selectedComplaintStatus(),
        semesterId: this.selectedSemesterId(),
        keyword: this.keyword(),
        page: this.currentPage(),
        size: this.pageSize(),
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const page = res.data as PageDTO<CertificateSubmissionComplaint> | undefined;
          this.complaints.set(page?.data || []);
          this.totalRows.set(page?.totalRows || 0);
          this.pageSize.set(page?.pageSize || this.pageSize());
          this.currentPage.set(page?.pageNumber != null ? page.pageNumber + 1 : this.currentPage());
        },
        error: (err) => {
          this.complaints.set([]);
          this.totalRows.set(0);
          this.alertService.error(
            err.error?.message || 'Không thể tải danh sách khiếu nại giấy khen.',
          );
        },
      });
  }

  loadStatusTotals(): void {
    const semesterId = this.selectedSemesterId();
    const keyword = this.keyword();
    forkJoin({
      pending: this.certificateService
        .getSubmissions({
          semesterId,
          keyword,
          status: 0,
          excludeAutoRejected: true,
          page: 1,
          size: 1,
        })
        .pipe(catchError(() => of(null))),
      approved: this.certificateService
        .getSubmissions({
          semesterId,
          keyword,
          status: 1,
          excludeAutoRejected: true,
          page: 1,
          size: 1,
        })
        .pipe(catchError(() => of(null))),
      rejected: this.certificateService
        .getSubmissions({
          semesterId,
          keyword,
          status: 2,
          excludeAutoRejected: true,
          page: 1,
          size: 1,
        })
        .pipe(catchError(() => of(null))),
    }).subscribe(({ pending, approved, rejected }) => {
      this.statusTotals.set({
        pending: pending?.data?.totalRows || 0,
        approved: approved?.data?.totalRows || 0,
        rejected: rejected?.data?.totalRows || 0,
      });
    });
  }

  loadComplaintTotals(): void {
    const semesterId = this.selectedSemesterId();
    const keyword = this.keyword();
    forkJoin({
      pending: this.complaintService
        .getComplaints({ semesterId, keyword, status: 0, page: 1, size: 1 })
        .pipe(catchError(() => of(null))),
      approved: this.complaintService
        .getComplaints({ semesterId, keyword, status: 1, page: 1, size: 1 })
        .pipe(catchError(() => of(null))),
      rejected: this.complaintService
        .getComplaints({ semesterId, keyword, status: 2, page: 1, size: 1 })
        .pipe(catchError(() => of(null))),
    }).subscribe(({ pending, approved, rejected }) => {
      this.complaintTotals.set({
        pending: pending?.data?.totalRows || 0,
        approved: approved?.data?.totalRows || 0,
        rejected: rejected?.data?.totalRows || 0,
      });
    });
  }

  changeStatus(status: CertificateSubmissionStatus | null): void {
    this.activeView.set('submissions');
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadSubmissions();
  }

  openComplaintTab(): void {
    this.activeView.set('complaints');
    this.currentPage.set(1);
    this.loadComplaintTotals();
    this.loadComplaints();
  }

  changeComplaintStatus(value: number | string | boolean | null): void {
    if (value === null || value === '') {
      this.selectedComplaintStatus.set(null);
    } else {
      const parsed = Number(value);
      this.selectedComplaintStatus.set(
        Number.isFinite(parsed) ? (parsed as CertificateSubmissionComplaintStatus) : null,
      );
    }
    this.currentPage.set(1);
    this.loadComplaints();
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
    this.loadComplaintTotals();
    this.loadCurrentPage();
  }

  setSemesterValue(value: number | string | boolean | null): void {
    if (value === null || value === '') {
      this.selectSemester(null);
      return;
    }

    const parsed = Number(value);
    this.selectSemester(Number.isFinite(parsed) ? parsed : null);
  }

  search(): void {
    this.currentPage.set(1);
    this.loadStatusTotals();
    this.loadComplaintTotals();
    this.loadCurrentPage();
  }

  clearSearch(): void {
    this.keyword.set('');
    this.search();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadCurrentPage();
  }

  onSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadCurrentPage();
  }

  openDetail(submission: CertificateSubmission): void {
    this.detailSubmission.set(submission);
  }

  closeDetail(): void {
    this.detailSubmission.set(null);
  }

  openComplaintDetail(complaint: CertificateSubmissionComplaint): void {
    this.detailComplaint.set(complaint);
  }

  closeComplaintDetail(): void {
    this.detailComplaint.set(null);
  }

  openApproveComplaint(complaint: CertificateSubmissionComplaint): void {
    this.detailComplaint.set(null);
    this.approvingComplaint.set(complaint);
    this.reviewCategoryId.set(null);
    this.reviewPoint.set(null);
    this.reviewCertificateTitle.set(complaint.certificateTitle || '');
    this.reviewAchievement.set(complaint.complaintReason || '');
    this.reviewNote.set('');
  }

  closeApproveComplaint(force = false): void {
    if (this.processingId() && !force) return;
    this.approvingComplaint.set(null);
    this.reviewCategoryId.set(null);
    this.reviewPoint.set(null);
    this.reviewCertificateTitle.set('');
    this.reviewAchievement.set('');
    this.reviewNote.set('');
  }

  submitApproveComplaint(): void {
    const complaint = this.approvingComplaint();
    const category = this.selectedCategory();
    const point = this.reviewPoint();
    if (!complaint || !category || point == null) return;
    if (this.approvalInvalid()) {
      this.alertService.error('Vui lòng kiểm tra tiêu chí và điểm được duyệt.');
      return;
    }

    this.processingId.set(complaint.id);
    this.complaintService
      .approve(complaint.id, {
        approvedCategoryId: category.id,
        approvedPoint: point,
        reviewNote: this.reviewNote().trim() || null,
      })
      .pipe(finalize(() => this.processingId.set(null)))
      .subscribe({
        next: () => {
          this.alertService.success('Đã duyệt khiếu nại và ghi nhận điểm.');
          this.processingId.set(null);
          this.closeApproveComplaint(true);
          this.closeComplaintDetail();
          this.loadStatusTotals();
          this.loadComplaintTotals();
          this.loadCurrentPage();
        },
        error: (err) =>
          this.alertService.error(err.error?.message || 'Không thể duyệt khiếu nại giấy khen.'),
      });
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
          this.loadCurrentPage();
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

  openRejectComplaint(complaint: CertificateSubmissionComplaint): void {
    this.detailComplaint.set(null);
    this.rejectingComplaint.set(complaint);
    this.rejectReason.set(complaint.rejectionReason || '');
  }

  closeReject(force = false): void {
    if (this.processingId() && !force) return;
    this.rejectingSubmission.set(null);
    this.rejectReason.set('');
  }

  closeRejectComplaint(force = false): void {
    if (this.processingId() && !force) return;
    this.rejectingComplaint.set(null);
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
          this.loadCurrentPage();
        },
        error: (err) =>
          this.alertService.error(err.error?.message || 'Không thể từ chối giấy khen.'),
      });
  }

  submitRejectComplaint(): void {
    const complaint = this.rejectingComplaint();
    const reason = this.rejectReason().trim();
    if (!complaint || !reason) return;
    if (reason.length < 10) {
      this.alertService.error('Vui lòng nhập lý do từ chối khiếu nại tối thiểu 10 ký tự.');
      return;
    }

    this.processingId.set(complaint.id);
    this.complaintService
      .reject(complaint.id, { rejectionReason: reason })
      .pipe(finalize(() => this.processingId.set(null)))
      .subscribe({
        next: () => {
          this.alertService.success('Đã từ chối khiếu nại giấy khen.');
          this.processingId.set(null);
          this.closeRejectComplaint(true);
          this.closeComplaintDetail();
          this.loadComplaintTotals();
          this.loadCurrentPage();
        },
        error: (err) =>
          this.alertService.error(err.error?.message || 'Không thể từ chối khiếu nại giấy khen.'),
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

  canReviewComplaint(complaint: CertificateSubmissionComplaint): boolean {
    return complaint.status === 0;
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

  complaintStatusLabel(status: number | null | undefined): string {
    if (status === 1) return 'Đã duyệt';
    if (status === 2) return 'Bị từ chối';
    return 'Chờ xử lý';
  }

  complaintStatusTone(status: number | null | undefined): string {
    if (status === 1) return 'success';
    if (status === 2) return 'danger';
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

  displayComplaintTitle(complaint: CertificateSubmissionComplaint): string {
    return complaint.certificateTitle || 'Giấy khen bị khiếu nại';
  }

  displayComplaintStudent(complaint: CertificateSubmissionComplaint): string {
    return (
      [complaint.studentCode, complaint.studentName].filter(Boolean).join(' - ') ||
      `SV #${complaint.studentId || 'N/A'}`
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

  trackComplaint(_: number, complaint: CertificateSubmissionComplaint): number {
    return complaint.id;
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
