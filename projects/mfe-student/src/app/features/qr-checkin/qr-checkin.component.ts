import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ApiResponse } from '@my-mfe/interface';

interface RegistrationQR {
  registrationId: number;
  activityId: number;
  activityTitle: string;
  qrData: string;
  checkInCode: string;
  validUntil: number;
  status: number;
  sessionInfo?: {
    sessionId: number;
    sessionName: string;
    checkInTime: string;
    checkOutTime: string;
  };
}

type QrMode = 'SCAN_EVENT' | 'MY_QR';

@Component({
  selector: 'app-qr-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './qr-checkin.component.html',
  styleUrl: './qr-checkin.component.scss',
})
export class QrCheckinComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  private baseUrl = 'http://localhost:8080';
  private activityApiUrl = `${this.baseUrl}/activity/api/v1`;

  readonly allowedFormats = [BarcodeFormat.QR_CODE];

  isLoading = signal(true);
  isScanning = signal(false);
  isSubmitting = signal(false);
  mode = signal<QrMode>('SCAN_EVENT');
  manualCode = '';
  myRegistrations = signal<RegistrationQR[]>([]);
  selectedRegistration = signal<RegistrationQR | null>(null);
  qrResult = signal<{
    success: boolean;
    message: string;
    activityTitle?: string;
    checkedInAt?: string;
  } | null>(null);

  ngOnInit(): void {
    this.loadMyRegistrations();
  }

  loadMyRegistrations(): void {
    this.isLoading.set(true);
    this.http.get<ApiResponse<any[]>>(`${this.activityApiUrl}/registrations/my-records`).subscribe({
      next: (res) => {
        const regs = (res.data || []).filter((r: any) => r.status === 0 || r.status === 1);
        if (regs.length === 0) {
          this.myRegistrations.set([]);
          this.selectedRegistration.set(null);
          this.isLoading.set(false);
          return;
        }

        const qrRequests = regs.map((r: any) =>
          this.http
            .get<ApiResponse<RegistrationQR>>(`${this.activityApiUrl}/registrations/${r.id}/qr`)
            .pipe(catchError(() => of(null))),
        );

        forkJoin(qrRequests)
          .pipe(finalize(() => this.isLoading.set(false)))
          .subscribe((results) => {
            const withQr = regs.map((r: any, i: number) => {
              const qr = results[i]?.data;
              return {
                registrationId: r.id,
                activityId: r.activityId,
                activityTitle: r.activityTitle || qr?.activityTitle || 'Hoạt động',
                qrData: qr?.qrData || '',
                checkInCode: qr?.checkInCode || `CK${String(r.id).padStart(6, '0')}`,
                validUntil: qr?.validUntil || 0,
                sessionInfo: qr?.sessionInfo,
                status: r.status,
              } as RegistrationQR;
            });

            this.myRegistrations.set(withQr);
            this.selectedRegistration.set(withQr[0] || null);
          });
      },
      error: () => {
        this.isLoading.set(false);
        this.qrResult.set({
          success: false,
          message: 'Không thể tải danh sách hoạt động đã đăng ký.',
        });
      },
    });
  }

  changeMode(nextMode: QrMode): void {
    this.mode.set(nextMode);
    this.isScanning.set(false);
    this.qrResult.set(null);
    this.manualCode = '';
  }

  startScanner(): void {
    this.qrResult.set(null);
    this.isScanning.set(true);
  }

  onScanSuccess(qrCode: string): void {
    if (this.isSubmitting()) return;
    this.isScanning.set(false);
    this.manualCode = qrCode.trim();
    this.submitCheckIn(qrCode);
  }

  submitManualCode(): void {
    this.submitCheckIn(this.manualCode);
  }

  submitCheckIn(rawCode: string): void {
    const selected = this.selectedRegistration();
    const verifyCode = rawCode.trim();
    if (!selected || !verifyCode) {
      this.qrResult.set({
        success: false,
        message: 'Vui lòng chọn hoạt động và cung cấp mã điểm danh.',
      });
      return;
    }

    this.isSubmitting.set(true);
    this.http
      .post<ApiResponse<any>>(`${this.activityApiUrl}/attendances/check-in`, {
        activityId: selected.activityId,
        method: 1,
        verifyCode,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (res) => {
          this.qrResult.set({
            success: true,
            message: res.data?.message || res.message || 'Điểm danh thành công.',
            activityTitle: selected.activityTitle,
            checkedInAt: new Date().toISOString(),
          });
          this.loadMyRegistrations();
        },
        error: (err) => {
          this.qrResult.set({
            success: false,
            message:
              err.error?.message || 'Mã điểm danh không hợp lệ hoặc không thuộc hoạt động đã chọn.',
          });
        },
      });
  }

  selectRegistration(reg: RegistrationQR): void {
    this.selectedRegistration.set(reg);
    this.qrResult.set(null);
    this.manualCode = '';
  }

  reset(): void {
    this.qrResult.set(null);
    this.manualCode = '';
    this.isScanning.set(false);
  }

  goBack(): void {
    this.router.navigate(['/my-records']);
  }
}
