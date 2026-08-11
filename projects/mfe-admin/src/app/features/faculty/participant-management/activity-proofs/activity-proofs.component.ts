import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

import {
  AlertService,
  ConfirmService,
  IACT_API_ORIGIN,
  PaginationComponent,
} from '@my-mfe/ui';
import {
  ApiResponse,
  PageDTO,
  RegistrationResponse,
  normalizeRegistrationDateFields,
} from '@my-mfe/interface';
import {
  ProofApproval,
  ProofApprovalService,
} from '../../services/proof-approval.service';

interface ProofActivitySummary {
  activityId: number;
  totalRegisteredStudents: number;
  totalEligibleStudents: number;
  totalSubmittedProofs: number;
  totalSubmittedStudents: number;
  totalNotSubmittedEligibleStudents: number;
  pendingProofs: number;
  approvedProofs: number;
  rejectedProofs: number;
  absentStudents: number;
  unreviewedAbsentStudents: number;
}

@Component({
  selector: 'app-activity-proofs',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './activity-proofs.component.html',
  styleUrl: './activity-proofs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityProofsComponent implements OnChanges {
  private proofService = inject(ProofApprovalService);
  private alertService = inject(AlertService);
  private confirmService = inject(ConfirmService);
  private http = inject(HttpClient);
  private readonly apiOrigin = inject(IACT_API_ORIGIN);
  private readonly proofApi = `${this.apiOrigin}/activity/api/v1/proofs`;
  private readonly registrationApi = `${this.apiOrigin}/activity/api/v1/registrations`;

  @Input({ required: true }) activityId: number | null = null;
  @Output() proofChanged = new EventEmitter<void>();
  @Output() totalChanged = new EventEmitter<number>();

  proofs = signal<ProofApproval[]>([]);
  isLoading = signal(false);
  statusFilter = signal<number | null>(0);
  page = signal(1);
  pageSize = signal(8);
  totalRows = signal(0);
  summary = signal<ProofActivitySummary | null>(null);
  summaryLoading = signal(false);
  showMissingProofs = signal(false);
  missingProofs = signal<RegistrationResponse[]>([]);
  missingProofTotalRows = signal(0);
  missingProofPage = signal(1);
  missingProofPageSize = signal(8);
  missingProofLoading = signal(false);
  processingId = signal<number | null>(null);
  rejectingProof = signal<ProofApproval | null>(null);
  rejectReason = signal('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activityId'] && this.activityId) {
      this.page.set(1);
      this.showMissingProofs.set(false);
      this.loadSummary();
      this.loadProofs();
    }
  }

  loadSummary(): void {
    if (!this.activityId) return;

    this.summaryLoading.set(true);
    this.http
      .get<ApiResponse<ProofActivitySummary>>(`${this.proofApi}/activity/summary`, {
        params: new HttpParams().set('activityId', String(this.activityId)),
      })
      .pipe(finalize(() => this.summaryLoading.set(false)))
      .subscribe({
        next: (response) => {
          const summary = response.data || null;
          this.summary.set(summary);
          this.totalChanged.emit(summary?.totalSubmittedStudents || 0);
        },
        error: (err: HttpErrorResponse) => {
          this.summary.set(null);
          this.totalChanged.emit(0);
          this.alertService.error(err.error?.message || 'Không thể tải thống kê minh chứng.');
        },
      });
  }

  loadProofs(): void {
    if (!this.activityId) {
      return;
    }

    this.isLoading.set(true);
    this.proofService
      .getProofs(this.statusFilter(), this.page(), this.pageSize(), this.activityId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const pageData = response.data;
          this.proofs.set(pageData?.data || []);
          const total = pageData?.totalRows || 0;
          this.totalRows.set(total);
        },
        error: (err: HttpErrorResponse) => {
          this.proofs.set([]);
          this.totalRows.set(0);
          this.alertService.error(
            err.error?.message || 'Không thể tải danh sách minh chứng của hoạt động.',
          );
        },
      });
  }

  refreshData(): void {
    this.loadSummary();
    this.loadProofs();
    if (this.showMissingProofs()) {
      this.loadMissingProofs();
    }
  }

  toggleMissingProofs(): void {
    const shouldShow = !this.showMissingProofs();
    this.showMissingProofs.set(shouldShow);
    if (shouldShow) {
      this.missingProofPage.set(1);
      this.loadMissingProofs();
    }
  }

  loadMissingProofs(): void {
    if (!this.activityId) return;

    const params = new HttpParams()
      .set('activityId', String(this.activityId))
      .set('page', String(this.missingProofPage() - 1))
      .set('size', String(this.missingProofPageSize()));

    this.missingProofLoading.set(true);
    this.http
      .get<ApiResponse<PageDTO<RegistrationResponse>>>(`${this.registrationApi}/without-proof`, { params })
      .pipe(finalize(() => this.missingProofLoading.set(false)))
      .subscribe({
        next: (response) => {
          const pageData = response.data;
          this.missingProofs.set(
            (pageData?.data || []).map((registration) => normalizeRegistrationDateFields(registration)),
          );
          this.missingProofTotalRows.set(pageData?.totalRows || 0);
        },
        error: (err: HttpErrorResponse) => {
          this.missingProofs.set([]);
          this.missingProofTotalRows.set(0);
          this.alertService.error(
            err.error?.message || 'Không thể tải danh sách sinh viên chưa nộp minh chứng.',
          );
        },
      });
  }

  onMissingProofPageChange(page: number): void {
    this.missingProofPage.set(page);
    this.loadMissingProofs();
  }

  onMissingProofSizeChange(size: number): void {
    this.missingProofPageSize.set(size);
    this.missingProofPage.set(1);
    this.loadMissingProofs();
  }

  onStatusChange(status: number | null): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.closeRejectModal();
    this.loadProofs();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadProofs();
  }

  onSizeChange(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
    this.loadProofs();
  }

  async approveProof(proof: ProofApproval): Promise<void> {
    try {
      await this.confirmService.confirm({
        title: 'Duyệt minh chứng?',
        message: `Xác nhận minh chứng của ${this.studentName(proof)} là hợp lệ.`,
        confirmText: 'Duyệt',
        cancelText: 'Hủy',
        type: 'success',
        onConfirm: () => this.submitApprove(proof),
      });
    } catch {
      // User cancelled.
    }
  }

  rejectProof(proof: ProofApproval): void {
    this.rejectingProof.set(proof);
    this.rejectReason.set(proof.rejectionReason || '');
  }

  closeRejectModal(): void {
    if (this.processingId()) {
      return;
    }
    this.rejectingProof.set(null);
    this.rejectReason.set('');
  }

  submitReject(): void {
    const proof = this.rejectingProof();
    const reason = this.rejectReason().trim();
    if (!proof || !reason) {
      return;
    }

    this.processingId.set(proof.id);
    this.proofService
      .rejectProof(proof.id, reason)
      .pipe(finalize(() => this.processingId.set(null)))
      .subscribe({
        next: () => {
          this.alertService.success('Đã từ chối minh chứng.');
          this.closeRejectModal();
          this.loadProofs();
          this.loadSummary();
          this.proofChanged.emit();
        },
        error: (err: HttpErrorResponse) =>
          this.alertService.error(err.error?.message || 'Không thể từ chối minh chứng.'),
      });
  }

  statusLabel(status: number | null | undefined): string {
    if (status === 1) return 'Đã duyệt';
    if (status === 2) return 'Từ chối';
    return 'Chờ duyệt';
  }

  statusClass(status: number | null | undefined): string {
    if (status === 1) return 'is-approved';
    if (status === 2) return 'is-rejected';
    return 'is-pending';
  }

  studentName(proof: ProofApproval | null | undefined): string {
    return proof?.studentName || proof?.studentCode || `SV #${proof?.studentId || 'N/A'}`;
  }

  private submitApprove(proof: ProofApproval): void {
    this.processingId.set(proof.id);
    this.proofService
      .approveProof(proof.id)
      .pipe(finalize(() => this.processingId.set(null)))
      .subscribe({
        next: () => {
          this.alertService.success('Đã duyệt minh chứng thành công.');
          this.loadProofs();
          this.loadSummary();
          this.proofChanged.emit();
        },
        error: (err: HttpErrorResponse) =>
          this.alertService.error(err.error?.message || 'Không thể duyệt minh chứng.'),
      });
  }
}
