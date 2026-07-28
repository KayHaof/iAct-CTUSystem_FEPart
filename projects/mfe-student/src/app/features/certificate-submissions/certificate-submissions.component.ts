import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  AfterViewInit,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { CloudinaryService } from '@my-mfe/data-access-media';
import { PageDTO, Semester } from '@my-mfe/interface';
import { AlertService, PaginationComponent } from '@my-mfe/ui';
import { CertificateSubmissionComplaint } from '../../shared/models/certificate-submission-complaint.model';
import {
  CertificateSubmission,
  CertificateSubmissionStatus,
} from '../../shared/models/certificate-submission.model';
import { CertificateSubmissionComplaintService } from '../../shared/services/certificate-submission-complaint.service';
import { CertificateSubmissionService } from '../../shared/services/certificate-submission.service';
import { SemesterService } from '../../shared/services/semester.service';

interface StatusOption {
  label: string;
  value: CertificateSubmissionStatus | null;
}

@Component({
  selector: 'app-certificate-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './certificate-submissions.component.html',
  styleUrl: './certificate-submissions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateSubmissionsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly certificateService = inject(CertificateSubmissionService);
  private readonly complaintService = inject(CertificateSubmissionComplaintService);
  private readonly semesterService = inject(SemesterService);
  private readonly cloudinaryService = inject(CloudinaryService);
  private readonly alertService = inject(AlertService);
  private readonly route = inject(ActivatedRoute);

  readonly statusOptions: StatusOption[] = [
    { label: 'Tất cả', value: null },
    { label: 'Chờ duyệt', value: 0 },
    { label: 'Đã duyệt', value: 1 },
    { label: 'Bị từ chối', value: 2 },
  ];

  private readonly complaintFetchSize = 100;

  semesters = signal<Semester[]>([]);
  selectedSemesterId = signal<number | null>(null);
  selectedStatus = signal<CertificateSubmissionStatus | null>(null);
  submissions = signal<CertificateSubmission[]>([]);
  statusTotals = signal({ pending: 0, approved: 0, rejected: 0 });
  totalRows = signal(0);
  totalPage = signal(0);
  currentPage = signal(1);
  pageSize = signal(8);

  complaints = signal<CertificateSubmissionComplaint[]>([]);

  selectedFile = signal<File | null>(null);
  selectedFileName = signal('');
  previewUrl = signal<string | null>(null);
  studentNote = signal('');
  isDragging = signal(false);
  isSubmitting = signal(false);
  isLoading = signal(false);
  isSubmitModalOpen = signal(false);
  isComplaintModalOpen = signal(false);
  isComplaintDetailModalOpen = signal(false);
  isComplaintSubmitting = signal(false);
  selectedComplaintSubmission = signal<CertificateSubmission | null>(null);
  selectedComplaintDetail = signal<CertificateSubmissionComplaint | null>(null);
  complaintReason = signal('');
  showScrollTop = signal(false);
  private scrollObserver?: IntersectionObserver;

  pendingCount = computed(() => this.statusTotals().pending);
  approvedCount = computed(() => this.statusTotals().approved);
  rejectedCount = computed(() => this.statusTotals().rejected);
  complaintIndex = computed(
    () => new Map(this.complaints().map((item) => [item.submissionId, item] as const)),
  );
  canSubmit = computed(() => !this.isSubmitting() && !!this.selectedFile());
  canSendComplaint = computed(
    () => !this.isComplaintSubmitting() && this.complaintReason().trim().length >= 10,
  );

  ngOnInit(): void {
    this.applyDeepLinkStatus(this.route.snapshot.queryParamMap.get('status'));
    this.loadSemesters();
  }

  ngAfterViewInit(): void {
    const sentinel = document.getElementById('certificate-page-top-sentinel');
    if (!sentinel || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.scrollObserver = new IntersectionObserver(
      ([entry]) => {
        this.showScrollTop.set(!entry.isIntersecting);
      },
      {
        threshold: 0,
      },
    );

    this.scrollObserver.observe(sentinel);
  }

  ngOnDestroy(): void {
    this.scrollObserver?.disconnect();
  }

  loadSemesters(): void {
    this.semesterService.getAllSemesters().subscribe({
      next: (res) => {
        const semesters = res.data || [];
        this.semesters.set(semesters);
        const active = semesters.find((semester) => semester.isActive);
        this.selectedSemesterId.set(active?.id ?? semesters[0]?.id ?? null);
        this.loadStatusTotals();
        this.loadSubmissions();
        this.loadComplaintHistory();
      },
      error: () => {
        this.alertService.error('Không thể tải danh sách học kỳ.');
        this.loadSubmissions();
        this.loadComplaintHistory();
      },
    });
  }

  loadStatusTotals(): void {
    const semesterId = this.selectedSemesterId();
    forkJoin({
      pending: this.certificateService
        .getMine({ semesterId, status: 0, page: 1, size: 1 })
        .pipe(catchError(() => of(null))),
      approved: this.certificateService
        .getMine({ semesterId, status: 1, page: 1, size: 1 })
        .pipe(catchError(() => of(null))),
      rejected: this.certificateService
        .getMine({ semesterId, status: 2, page: 1, size: 1 })
        .pipe(catchError(() => of(null))),
    }).subscribe(({ pending, approved, rejected }) => {
      this.statusTotals.set({
        pending: pending?.data?.totalRows || 0,
        approved: approved?.data?.totalRows || 0,
        rejected: rejected?.data?.totalRows || 0,
      });
    });
  }

  loadSubmissions(): void {
    this.isLoading.set(true);
    this.certificateService
      .getMine({
        semesterId: this.selectedSemesterId(),
        status: this.selectedStatus(),
        page: this.currentPage(),
        size: this.pageSize(),
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const page = res.data as PageDTO<CertificateSubmission> | undefined;
          this.submissions.set(page?.data || []);
          this.totalRows.set(page?.totalRows || 0);
          this.totalPage.set(page?.totalPage || 0);
          this.pageSize.set(page?.pageSize || this.pageSize());
          this.currentPage.set(page?.pageNumber != null ? page.pageNumber + 1 : this.currentPage());
        },
        error: (err) => {
          this.submissions.set([]);
          this.totalRows.set(0);
          this.totalPage.set(0);
          this.alertService.error(err.error?.message || 'Không thể tải danh sách giấy khen.');
        },
      });
  }

  loadComplaintHistory(): void {
    this.complaintService
      .getMine({
        semesterId: this.selectedSemesterId(),
        page: 1,
        size: this.complaintFetchSize,
      })
      .subscribe({
        next: (res) => {
          const page = res.data as PageDTO<CertificateSubmissionComplaint> | undefined;
          this.complaints.set(page?.data || []);
        },
        error: () => {
          this.complaints.set([]);
        },
      });
  }

  selectSemester(semesterId: number | null): void {
    this.selectedSemesterId.set(semesterId);
    this.currentPage.set(1);
    this.loadStatusTotals();
    this.loadSubmissions();
    this.loadComplaintHistory();
  }

  changeStatus(status: CertificateSubmissionStatus | null): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadSubmissions();
  }

  openSubmitModal(): void {
    this.isSubmitModalOpen.set(true);
  }

  closeSubmitModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitModalOpen.set(false);
    this.resetSubmitForm();
  }

  openComplaintModal(item: CertificateSubmission): void {
    if (item.status !== 2) {
      return;
    }

    const existingComplaint = this.complaintForSubmission(item.id);
    if (existingComplaint) {
      this.openComplaintDetail(existingComplaint);
      return;
    }

    this.selectedComplaintSubmission.set(item);
    this.complaintReason.set('');
    this.isComplaintModalOpen.set(true);
  }

  closeComplaintModal(): void {
    if (this.isComplaintSubmitting()) {
      return;
    }

    this.isComplaintModalOpen.set(false);
    this.selectedComplaintSubmission.set(null);
    this.complaintReason.set('');
  }

  openComplaintDetail(complaint: CertificateSubmissionComplaint): void {
    this.selectedComplaintDetail.set(complaint);
    this.isComplaintDetailModalOpen.set(true);
  }

  closeComplaintDetailModal(): void {
    this.isComplaintDetailModalOpen.set(false);
    this.selectedComplaintDetail.set(null);
  }

  submitCertificate(): void {
    const file = this.selectedFile();

    if (!file) {
      this.alertService.error('Vui lòng chọn ảnh giấy khen.');
      return;
    }

    this.isSubmitting.set(true);
    this.cloudinaryService.uploadImage(file, 'certificate').subscribe({
      next: (uploadedUrl) => this.executeSubmit(uploadedUrl),
      error: () => {
        this.isSubmitting.set(false);
        this.alertService.error('Không thể tải ảnh giấy khen lên Cloudinary.');
      },
    });
  }

  submitComplaint(): void {
    const submission = this.selectedComplaintSubmission();
    const reason = this.complaintReason().trim();

    if (!submission) {
      this.alertService.error('Không tìm thấy hồ sơ giấy khen cần khiếu nại.');
      return;
    }

    if (reason.length < 10) {
      this.alertService.error('Vui lòng nhập lý do khiếu nại ít nhất 10 ký tự.');
      return;
    }

    this.isComplaintSubmitting.set(true);
    this.complaintService
      .submit({
        submissionId: submission.id,
        complaintReason: reason,
      })
      .pipe(finalize(() => this.isComplaintSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.closeComplaintModal();
          this.alertService.success(
            'Đã gửi khiếu nại giấy khen. Vui lòng chờ Trường xử lý thủ công.',
          );
          this.loadComplaintHistory();
          this.loadSubmissions();
        },
        error: (err) => {
          this.alertService.error(err.error?.message || 'Không thể gửi khiếu nại giấy khen.');
        },
      });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
    input.value = '';
  }

  removeFile(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedFile.set(null);
    this.selectedFileName.set('');
    this.previewUrl.set(null);
  }

  goToPage(page: number): void {
    if (
      page < 1 ||
      (this.totalPage() > 0 && page > this.totalPage()) ||
      page === this.currentPage()
    ) {
      return;
    }

    this.currentPage.set(page);
    this.loadSubmissions();
  }

  changePageSize(size: number): void {
    if (size <= 0 || size === this.pageSize()) {
      return;
    }

    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadSubmissions();
  }

  scrollToTop(): void {
    document
      .getElementById('certificate-page-top')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  statusLabel(status: number | null | undefined): string {
    switch (status) {
      case 0:
        return 'Chờ duyệt';
      case 1:
        return 'Đã duyệt';
      case 2:
        return 'Bị từ chối';
      case 3:
        return 'Đã hủy';
      default:
        return 'Không rõ';
    }
  }

  statusTone(status: number | null | undefined): string {
    switch (status) {
      case 0:
        return 'warning';
      case 1:
        return 'success';
      case 2:
        return 'danger';
      case 3:
        return 'muted';
      default:
        return 'muted';
    }
  }

  complaintStatusLabel(status: number | null | undefined): string {
    switch (status) {
      case 0:
        return 'Chờ xử lý';
      case 1:
        return 'Đã duyệt';
      case 2:
        return 'Bị từ chối';
      default:
        return 'Không rõ';
    }
  }

  complaintStatusTone(status: number | null | undefined): string {
    switch (status) {
      case 0:
        return 'warning';
      case 1:
        return 'success';
      case 2:
        return 'danger';
      default:
        return 'muted';
    }
  }

  displayTitle(item: CertificateSubmission): string {
    return item.certificateTitle || item.achievement || 'Giấy khen chưa xác định tiêu đề';
  }

  displayStudent(item: CertificateSubmission): string {
    const code = item.extractedStudentCode || item.studentCode;
    const name = item.extractedStudentName || item.studentName;
    return [code, name].filter(Boolean).join(' - ') || 'Chưa nhận diện sinh viên';
  }

  complaintTitle(item: CertificateSubmissionComplaint): string {
    return item.certificateTitle || 'Giấy khen chưa xác định';
  }

  complaintStudent(item: CertificateSubmissionComplaint): string {
    return (
      [item.studentCode, item.studentName].filter(Boolean).join(' - ') || 'Chưa nhận diện sinh viên'
    );
  }

  complaintForSubmission(submissionId: number): CertificateSubmissionComplaint | undefined {
    return this.complaintIndex().get(submissionId);
  }

  trackSubmission(_: number, item: CertificateSubmission): number {
    return item.id;
  }

  formatSemesterLabel(semester: Semester): string {
    return `${semester.semesterName} (${semester.academicYear})`;
  }

  private executeSubmit(imageUrl: string): void {
    this.certificateService
      .submit({
        imageUrl,
        semesterId: this.selectedSemesterId(),
        studentNote: this.studentNote().trim() || null,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.alertService.success('Đã nộp giấy khen. Hồ sơ đang chờ Trường duyệt.');
          this.resetSubmitForm();
          this.isSubmitModalOpen.set(false);
          this.selectedStatus.set(null);
          this.currentPage.set(1);
          this.loadStatusTotals();
          this.loadSubmissions();
        },
        error: (err) => {
          this.alertService.error(err.error?.message || 'Không thể nộp giấy khen.');
        },
      });
  }

  private handleFile(file: File): void {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      this.alertService.error('Ảnh giấy khen vượt quá 10MB.');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      this.alertService.error('Vui lòng chọn ảnh JPG, PNG hoặc WEBP.');
      return;
    }

    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      this.previewUrl.set(event.target?.result as string | null);
    };
    reader.readAsDataURL(file);
  }

  private resetSubmitForm(): void {
    this.selectedFile.set(null);
    this.selectedFileName.set('');
    this.previewUrl.set(null);
    this.studentNote.set('');
  }

  private applyDeepLinkStatus(statusParam: string | null): void {
    if (statusParam === null || statusParam === 'all') {
      this.selectedStatus.set(null);
      return;
    }

    const parsed = Number(statusParam);
    const isValidStatus = parsed === 0 || parsed === 1 || parsed === 2 || parsed === 3;
    this.selectedStatus.set(
      Number.isNaN(parsed) || !isValidStatus ? null : (parsed as CertificateSubmissionStatus),
    );
  }
}
