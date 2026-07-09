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
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ApiResponse } from '@my-mfe/interface';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

import {
  PaginationComponent,
  AlertService,
  ConfirmService,
  ConfirmDialogComponent,
  // PageHeaderComponent,
  TableContainerComponent,
} from '@my-mfe/ui';
import { CloudinaryPathPipe } from '@my-mfe/data-access-media';
import { ParticipantService } from '../services/participant.service';
import { RegistrationResponse } from '@my-mfe/interface';
import { PageDTO } from '@my-mfe/interface';
import {
  ProofApproval,
  ProofApprovalService,
} from '../services/proof-approval.service';

@Component({
  selector: 'app-participant-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent,

    // PageHeaderComponent,

    TableContainerComponent,
    NgOptimizedImage,
    CloudinaryPathPipe, // Import pipe
    ZXingScannerModule,
    ConfirmDialogComponent,
  ],
  templateUrl: './participant-management.component.html',
  styleUrl: './participant-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private participantService = inject(ParticipantService);
  private proofService = inject(ProofApprovalService);
  private alertService = inject(AlertService);
  private confirmService = inject(ConfirmService);

  activityId = signal<number | null>(null);

  // --- QUẢN LÝ TRẠNG THÁI ---
  searchQuery = signal('');
  activeView = signal<'PARTICIPANTS' | 'PROOFS'>('PARTICIPANTS');
  currentTab = signal('ALL');
  currentPage = signal(1);
  pageSize = signal(10);
  isLoading = signal(false);
  isQrScannerOpen = signal(false);
  isVerifyingQr = signal(false);
  isProofLoading = signal(false);
  lastScannedQr = signal('');
  qrAction = signal<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  proofStatus = signal<number | null>(0);
  proofPage = signal(1);
  proofPageSize = signal(6);
  proofTotalRows = signal(0);
  processingProofId = signal<number | null>(null);
  rejectingProof = signal<ProofApproval | null>(null);
  rejectReason = signal('');

  totalRows = signal(0);
  participants = signal<RegistrationResponse[]>([]);
  proofs = signal<ProofApproval[]>([]);
  allowedFormats = [BarcodeFormat.QR_CODE];
  pendingProofCount = computed(() => this.proofs().filter((proof) => proof.status === 0).length);

  // --- QUẢN LÝ SORT CLIENT ---
  sortColumn = signal<keyof RegistrationResponse | ''>(''); // Cột đang sort
  sortDirection = signal<'asc' | 'desc'>('asc'); // Chiều sort

  private searchTimeout?: ReturnType<typeof setTimeout>;

  sortedParticipants = computed(() => {
    const data = [...this.participants()];
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
    if (idParam) {
      this.activityId.set(Number(idParam));
      this.fetchParticipants();
      this.fetchProofs();
    } else {
      this.alertService.error('Không tìm thấy mã hoạt động!');
      this.goBack();
    }
  }

  fetchParticipants(): void {
    const actId = this.activityId();
    if (!actId) return;

    this.isLoading.set(true);
    this.participantService
      .getParticipantsByActivity(
        actId,
        this.searchQuery(),
        this.currentTab(),
        this.currentPage(),
        this.pageSize(),
      )
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response: ApiResponse<PageDTO<RegistrationResponse>>) => {
          const pageData = response.data;
          this.participants.set(pageData?.data || []);
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

  fetchProofs(): void {
    const actId = this.activityId();
    if (!actId) return;

    this.isProofLoading.set(true);
    this.proofService
      .getProofs(this.proofStatus(), this.proofPage(), this.proofPageSize(), actId)
      .pipe(finalize(() => this.isProofLoading.set(false)))
      .subscribe({
        next: (response: ApiResponse<PageDTO<ProofApproval>>) => {
          const pageData = response.data;
          this.proofs.set(pageData?.data || []);
          this.proofTotalRows.set(pageData?.totalRows || 0);
        },
        error: (err: HttpErrorResponse) => {
          this.alertService.error(
            err.error?.message || 'Không thể tải danh sách minh chứng của hoạt động.',
          );
          this.proofs.set([]);
          this.proofTotalRows.set(0);
        },
      });
  }

  // --- ACTIONS ---
  goBack(): void {
    this.location.back();
  }

  onTabChange(tab: string): void {
    this.currentTab.set(tab);
    this.currentPage.set(1);
    this.fetchParticipants();
  }

  setActiveView(view: 'PARTICIPANTS' | 'PROOFS'): void {
    this.activeView.set(view);
    if (view === 'PROOFS' && this.proofs().length === 0) {
      this.fetchProofs();
    }
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

  onProofStatusChange(status: number | null): void {
    this.proofStatus.set(status);
    this.proofPage.set(1);
    this.fetchProofs();
  }

  onProofPageChange(page: number): void {
    this.proofPage.set(page);
    this.fetchProofs();
  }

  onProofSizeChange(size: number): void {
    this.proofPageSize.set(size);
    this.proofPage.set(1);
    this.fetchProofs();
  }

  toggleSort(column: keyof RegistrationResponse): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  async changeStatus(id: number, newStatus: number, actionName: string): Promise<void> {
    try {
      await this.confirmService.confirm({
        title: `Xác nhận ${actionName}?`,
        message: `Bạn có chắc chắn muốn ${actionName.toLowerCase()} sinh viên này không?`,
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
        type: newStatus === 2 ? 'danger' : 'warning',
        onConfirm: () => this.updateParticipantStatus(id, newStatus, actionName),
      });
    } catch {
      // User cancelled.
    }
  }
  private updateParticipantStatus(id: number, newStatus: number, actionName: string): void {
    this.isLoading.set(true);
    this.participantService
      .updateParticipantStatus(id, newStatus)
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

  openQrScanner(): void {
    this.lastScannedQr.set('');
    this.qrAction.set('CHECK_IN');
    this.isQrScannerOpen.set(true);
  }

  closeQrScanner(): void {
    this.isQrScannerOpen.set(false);
    this.isVerifyingQr.set(false);
    this.lastScannedQr.set('');
  }

  setQrAction(action: 'CHECK_IN' | 'CHECK_OUT'): void {
    this.qrAction.set(action);
    this.lastScannedQr.set('');
  }

  onStudentQrScanned(qrData: string): void {
    const actId = this.activityId();
    const normalizedQr = qrData.trim();
    if (!actId || !normalizedQr || this.isVerifyingQr() || normalizedQr === this.lastScannedQr()) {
      return;
    }

    this.lastScannedQr.set(normalizedQr);
    this.isVerifyingQr.set(true);
    this.participantService
      .verifyStudentQr(actId, normalizedQr, this.qrAction())
      .pipe(finalize(() => this.isVerifyingQr.set(false)))
      .subscribe({
        next: (res) => {
          this.alertService.success(res.data?.message || res.message || 'Đã xác thực tham gia!');
          this.fetchParticipants();
        },
        error: (err: HttpErrorResponse) => {
          this.alertService.error(err.error?.message || 'Mã QR sinh viên không hợp lệ!');
          this.lastScannedQr.set('');
        },
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

    this.isLoading.set(true);
    this.participantService
      .exportExcel(actId, this.searchQuery(), this.currentTab())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (blob: Blob) => {
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `Danh_sach_Sinh_vien_${actId}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(downloadUrl);

          this.alertService.success('Đã xuất file Excel thành công!');
        },
        error: () => {
          this.alertService.error('Có lỗi xảy ra khi tải file Excel!');
        },
      });
  }

  async approveProof(proof: ProofApproval): Promise<void> {
    try {
      await this.confirmService.confirm({
        title: 'Duyệt minh chứng?',
        message: `Xác nhận minh chứng của ${this.proofStudentName(proof)} là hợp lệ.`,
        confirmText: 'Duyệt',
        cancelText: 'Hủy',
        type: 'success',
        onConfirm: () => {
          this.processingProofId.set(proof.id);
          this.proofService
            .approveProof(proof.id)
            .pipe(finalize(() => this.processingProofId.set(null)))
            .subscribe({
              next: () => {
                this.alertService.success('Đã duyệt minh chứng thành công.');
                this.fetchProofs();
                this.fetchParticipants();
              },
              error: (err: HttpErrorResponse) =>
                this.alertService.error(err.error?.message || 'Không thể duyệt minh chứng.'),
            });
        },
      });
    } catch {
      // User cancelled.
    }
  }

  rejectProof(proof: ProofApproval): void {
    this.rejectingProof.set(proof);
    this.rejectReason.set(proof.rejectionReason || '');
  }

  closeRejectProofModal(): void {
    if (this.processingProofId()) return;
    this.rejectingProof.set(null);
    this.rejectReason.set('');
  }

  submitRejectProof(): void {
    const proof = this.rejectingProof();
    const reason = this.rejectReason().trim();
    if (!proof) return;
    if (!reason) return;

    this.processingProofId.set(proof.id);
    this.proofService
      .rejectProof(proof.id, reason)
      .pipe(finalize(() => this.processingProofId.set(null)))
      .subscribe({
        next: () => {
          this.alertService.success('Đã từ chối minh chứng.');
          this.closeRejectProofModal();
          this.fetchProofs();
        },
        error: (err: HttpErrorResponse) =>
          this.alertService.error(err.error?.message || 'Không thể từ chối minh chứng.'),
      });
  }

  proofStatusLabel(status: number): string {
    if (status === 1) return 'Đã duyệt';
    if (status === 2) return 'Từ chối';
    return 'Chờ duyệt';
  }

  proofStudentName(proof: ProofApproval): string {
    return proof.studentName || proof.studentCode || `SV ${proof.studentId}`;
  }
}
