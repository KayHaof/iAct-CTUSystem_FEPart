import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

import { AlertService, PaginationComponent } from '@my-mfe/ui';
import {
  ActivityComplaint,
  ActivityComplaintService,
} from '../../services/activity-complaint.service';

type ComplaintDecision = 'APPROVE' | 'REJECT';

@Component({
  selector: 'app-activity-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './activity-complaints.component.html',
  styleUrl: './activity-complaints.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityComplaintsComponent implements OnChanges {
  private complaintService = inject(ActivityComplaintService);
  private alertService = inject(AlertService);

  @Input({ required: true }) activityId: number | null = null;
  @Output() totalChanged = new EventEmitter<number>();

  complaints = signal<ActivityComplaint[]>([]);
  isLoading = signal(false);
  statusFilter = signal<number | null>(0);
  page = signal(1);
  pageSize = signal(6);
  totalRows = signal(0);
  processingId = signal<number | null>(null);
  selectedComplaint = signal<ActivityComplaint | null>(null);
  decision = signal<ComplaintDecision>('APPROVE');
  responseText = signal('');

  pendingCount = computed(() => this.complaints().filter((item) => item.status === 0).length);
  selectedStudentLabel = computed(() => this.studentLabel(this.selectedComplaint()));
  isApproveDecision = computed(() => this.decision() === 'APPROVE');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activityId'] && this.activityId) {
      this.page.set(1);
      this.loadComplaints();
    }
  }

  loadComplaints(): void {
    if (!this.activityId) {
      return;
    }

    this.isLoading.set(true);
    this.complaintService
      .getByActivity(this.activityId, this.statusFilter(), this.page(), this.pageSize())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const pageData = response.data;
          this.complaints.set(pageData?.data || []);
          const total = pageData?.totalRows || 0;
          this.totalRows.set(total);
          if (this.statusFilter() === 0) {
            this.totalChanged.emit(total);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.complaints.set([]);
          this.totalRows.set(0);
          if (this.statusFilter() === 0) {
            this.totalChanged.emit(0);
          }
          this.alertService.error(
            err.error?.message || 'Chưa thể tải danh sách khiếu nại của hoạt động.',
          );
        },
      });
  }

  onStatusChange(status: number | null): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.closeResponsePanel();
    this.loadComplaints();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadComplaints();
  }

  onSizeChange(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
    this.loadComplaints();
  }

  openResponsePanel(complaint: ActivityComplaint, decision: ComplaintDecision): void {
    this.selectedComplaint.set(complaint);
    this.decision.set(decision);
    this.responseText.set(
      complaint.response ||
        complaint.detailResponse ||
        this.defaultResponse(decision, complaint),
    );
  }

  closeResponsePanel(): void {
    if (this.processingId()) {
      return;
    }

    this.selectedComplaint.set(null);
    this.responseText.set('');
    this.decision.set('APPROVE');
  }

  submitResponse(): void {
    const complaint = this.selectedComplaint();
    const response = this.responseText().trim();
    if (!complaint || !response) {
      return;
    }

    this.processingId.set(complaint.id);
    const request = { response };
    const action$ =
      this.decision() === 'APPROVE'
        ? this.complaintService.approve(complaint.id, request)
        : this.complaintService.reject(complaint.id, request);

    action$.pipe(finalize(() => this.processingId.set(null))).subscribe({
      next: () => {
        this.alertService.success(
          this.decision() === 'APPROVE'
            ? 'Đã duyệt khiếu nại. Sinh viên sẽ được ghi nhận điểm danh và được nhắc nộp minh chứng.'
            : 'Đã phản hồi từ chối khiếu nại.',
        );
        this.closeResponsePanel();
        this.loadComplaints();
      },
      error: (err: HttpErrorResponse) => {
        this.alertService.error(err.error?.message || 'Không thể xử lý khiếu nại.');
      },
    });
  }

  statusLabel(status: number | null | undefined): string {
    if (status === 1) {
      return 'Đã duyệt';
    }
    if (status === 2) {
      return 'Từ chối';
    }
    return 'Chờ xử lý';
  }

  statusClass(status: number | null | undefined): string {
    if (status === 1) {
      return 'is-approved';
    }
    if (status === 2) {
      return 'is-rejected';
    }
    return 'is-pending';
  }

  studentLabel(complaint: ActivityComplaint | null | undefined): string {
    return complaint?.studentName || complaint?.studentCode || `SV #${complaint?.studentId || 'N/A'}`;
  }

  private defaultResponse(decision: ComplaintDecision, complaint: ActivityComplaint): string {
    if (decision === 'APPROVE') {
      return `Khiếu nại của ${this.studentLabel(complaint)} được chấp nhận. Nhà trường ghi nhận sinh viên đã điểm danh thành công cho hoạt động này; vui lòng nộp lại minh chứng tham gia để hoàn tất ghi nhận.`;
    }

    return `Khiếu nại của ${this.studentLabel(complaint)} chưa đủ cơ sở để chấp nhận. Vui lòng bổ sung thông tin hoặc minh chứng liên quan nếu cần hỗ trợ thêm.`;
  }
}
