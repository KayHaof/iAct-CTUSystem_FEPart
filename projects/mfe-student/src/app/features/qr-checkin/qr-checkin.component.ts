import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { firstValueFrom } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ApiResponse } from '@my-mfe/interface';
import { AlertService } from '@my-mfe/ui';
import {
  AttendanceResponse,
  AttendanceService,
  CheckInRequest,
} from '../../shared/services/attendance.service';
import { ActivityRecord, RegistrationService } from '../../shared/services/registration.service';

type QrAction = 'CHECK_IN' | 'CHECK_OUT';
type AttendanceApiResponse = ApiResponse<AttendanceResponse>;

interface QrRegistrationRecord extends ActivityRecord {
  activityTitle?: string;
  attendanceStatus?: string;
  participationStatus?: string;
}

interface ParsedQrPayload {
  verifyCode: string;
  activityId?: number;
  registrationId?: number;
  action?: QrAction;
}

interface QrCandidate {
  activityId: number;
  action: QrAction;
  record?: QrRegistrationRecord;
}

interface QrResultState {
  success: boolean;
  title: string;
  message: string;
  action?: QrAction;
  activityId?: number;
  activityTitle?: string;
  attendance?: AttendanceResponse;
}

@Component({
  selector: 'app-qr-checkin',
  standalone: true,
  imports: [CommonModule, RouterLink, ZXingScannerModule],
  templateUrl: './qr-checkin.component.html',
  styleUrls: ['./qr-checkin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrCheckinComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly registrationService = inject(RegistrationService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly alertService = inject(AlertService);

  readonly allowedFormats = [BarcodeFormat.QR_CODE];

  records = signal<QrRegistrationRecord[]>([]);
  isLoading = signal(false);
  isScanning = signal(false);
  isSubmitting = signal(false);
  result = signal<QrResultState | null>(null);

  eligibleCount = computed(() => this.records().length);
  canContinueToFace = computed(() => {
    const result = this.result();
    return result?.success === true && result.action === 'CHECK_OUT' && !!result.activityId;
  });
  syncLabel = computed(() => {
    if (this.isLoading()) {
      return 'Đang đồng bộ dữ liệu';
    }

    const count = this.eligibleCount();
    return count > 0 ? `${count} hoạt động có thể điểm danh` : 'Sẵn sàng quét mã từ BTC';
  });

  private preferredActivityId: number | null = null;
  private preferredAction: QrAction | null = null;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const activityId = params.get('activityId');
    this.preferredActivityId = this.numberFromValue(activityId) ?? null;
    this.preferredAction = this.parseAction(params.get('action'));
    this.loadRecords();
  }

  loadRecords(silent = false): void {
    if (!silent) {
      this.isLoading.set(true);
    }

    this.registrationService
      .getMyRecords()
      .pipe(
        finalize(() => {
          if (!silent) {
            this.isLoading.set(false);
          }
        }),
      )
      .subscribe({
        next: (res) => {
          const records = ((res.data ?? res.result ?? []) as QrRegistrationRecord[]).filter(
            (record) => this.canUseQr(record),
          );
          this.records.set(records);
        },
        error: () => {
          this.records.set([]);
          if (!silent) {
            this.alertService.error(
              'Không thể đồng bộ hoạt động điểm danh. Bạn vẫn có thể quét mã có đủ thông tin hoạt động.',
            );
          }
        },
      });
  }

  startScanner(): void {
    this.result.set(null);
    this.isScanning.set(true);
  }

  stopScanner(): void {
    this.isScanning.set(false);
  }

  scanAgain(): void {
    this.startScanner();
  }

  onScanSuccess(rawCode: string): void {
    if (this.isSubmitting()) {
      return;
    }

    this.isScanning.set(false);
    void this.submitQr(rawCode);
  }

  async submitQr(rawCode: string): Promise<void> {
    const parsed = this.parseQrPayload(rawCode);
    if (!parsed) {
      this.result.set({
        success: false,
        title: 'Không đọc được mã QR',
        message: 'Vui lòng đưa mã QR của BTC vào giữa khung camera và thử lại.',
      });
      return;
    }

    const candidates = this.resolveCandidates(parsed);
    if (candidates.length === 0) {
      this.result.set({
        success: false,
        title: 'Thiếu thông tin hoạt động',
        message:
          'Mã QR này chưa đủ dữ liệu để tự xác định hoạt động. Vui lòng dùng mã QR điểm danh do BTC phát trên hệ thống.',
      });
      return;
    }

    this.isSubmitting.set(true);
    try {
      const { candidate, response } = await this.trySubmitCandidates(candidates, parsed.verifyCode);
      const record =
        candidate.record || this.records().find((item) => item.activityId === candidate.activityId);
      const attendance = response.data ?? response.result;

      this.result.set({
        success: true,
        title: `Đã ghi nhận ${this.actionLabel(candidate.action).toLowerCase()}`,
        message: this.successMessage(candidate.action, attendance?.message || response.message),
        action: candidate.action,
        activityId: candidate.activityId,
        activityTitle: record?.activityTitle || record?.title,
        attendance,
      });

      this.loadRecords(true);
    } catch (error) {
      this.result.set({
        success: false,
        title: 'Không thể ghi nhận điểm danh',
        message: this.resolveErrorMessage(error, candidates.length > 1),
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  actionLabel(action: QrAction | null | undefined): string {
    return action === 'CHECK_OUT' ? 'Check-out' : 'Check-in';
  }

  goBack(): void {
    this.router.navigate(['/my-records']);
  }

  goToFaceVerification(): void {
    const activityId = this.result()?.activityId;
    if (!activityId) {
      this.goBack();
      return;
    }

    this.router.navigate(['/my-records'], {
      queryParams: { faceActivityId: activityId },
    });
  }

  private async trySubmitCandidates(
    candidates: QrCandidate[],
    verifyCode: string,
  ): Promise<{ candidate: QrCandidate; response: AttendanceApiResponse }> {
    let lastError: unknown = null;

    for (const candidate of candidates) {
      const request: CheckInRequest = {
        activityId: candidate.activityId,
        method: 1,
        verifyCode,
      };

      try {
        const call =
          candidate.action === 'CHECK_OUT'
            ? this.attendanceService.checkOut(request)
            : this.attendanceService.checkIn(request);
        const response: AttendanceApiResponse = await firstValueFrom(call);
        return { candidate, response };
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('QR attendance failed');
  }

  private resolveCandidates(parsed: ParsedQrPayload): QrCandidate[] {
    const records = this.prioritizeRecords(this.records());
    let matchingRecords = records;

    if (parsed.registrationId) {
      matchingRecords = records.filter((record) => record.id === parsed.registrationId);
    } else if (parsed.activityId) {
      matchingRecords = records.filter((record) => record.activityId === parsed.activityId);
    }

    const candidates = matchingRecords.map((record) => ({
      activityId: record.activityId,
      action: parsed.action || this.preferredActionFor(record) || this.actionForRecord(record),
      record,
    }));

    if (candidates.length > 0) {
      return candidates;
    }

    if (parsed.activityId) {
      return [
        {
          activityId: parsed.activityId,
          action: parsed.action || this.preferredAction || 'CHECK_IN',
        },
      ];
    }

    return [];
  }

  private preferredActionFor(record: QrRegistrationRecord): QrAction | null {
    return this.preferredActivityId === record.activityId ? this.preferredAction : null;
  }

  private prioritizeRecords(records: QrRegistrationRecord[]): QrRegistrationRecord[] {
    if (!this.preferredActivityId) {
      return records;
    }

    return [...records].sort((a, b) => {
      if (a.activityId === this.preferredActivityId) return -1;
      if (b.activityId === this.preferredActivityId) return 1;
      return 0;
    });
  }

  private actionForRecord(record: QrRegistrationRecord): QrAction {
    return record.nextAction === 'QR_CHECK_OUT' || record.attendanceStatus === 'CHECKED_IN'
      ? 'CHECK_OUT'
      : 'CHECK_IN';
  }

  private canUseQr(record: QrRegistrationRecord): boolean {
    if (!record || record.status === 2 || record.participationStatus === 'CANCELLED') {
      return false;
    }

    return (
      record.nextAction === 'QR_CHECK_IN' ||
      record.nextAction === 'QR_CHECK_OUT' ||
      record.attendanceStatus === 'NOT_CHECKED_IN' ||
      record.attendanceStatus === 'CHECKED_IN'
    );
  }

  private parseQrPayload(rawCode: string): ParsedQrPayload | null {
    const raw = rawCode.trim();
    if (!raw) {
      return null;
    }

    const jsonPayload = this.tryParseJson(raw);
    if (jsonPayload) {
      const verifyCode = this.readString(jsonPayload, [
        'verifyCode',
        'qrCodeToken',
        'qrToken',
        'token',
        'code',
      ]);
      return {
        verifyCode: verifyCode || raw,
        activityId: this.readNumber(jsonPayload, ['activityId', 'activity_id', 'actId']),
        registrationId: this.readNumber(jsonPayload, [
          'registrationId',
          'registration_id',
          'regId',
        ]),
        action: this.parseAction(this.readString(jsonPayload, ['action', 'mode', 'type'])) ?? undefined,
      };
    }

    const urlPayload = this.tryParseUrl(raw);
    if (urlPayload) {
      return urlPayload;
    }

    const paramPayload = this.tryParseSearchParams(raw);
    if (paramPayload) {
      return paramPayload;
    }

    return { verifyCode: raw };
  }

  private tryParseJson(value: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  private tryParseUrl(value: string): ParsedQrPayload | null {
    try {
      const url = new URL(value);
      const params = url.searchParams;
      const verifyCode =
        this.firstParam(params, ['verifyCode', 'qrCodeToken', 'qrToken', 'token', 'code']) ||
        this.lastPathSegment(url.pathname);

      return {
        verifyCode: verifyCode || value,
        activityId: this.numberFromValue(
          this.firstParam(params, ['activityId', 'activity_id', 'actId']),
        ),
        registrationId: this.numberFromValue(
          this.firstParam(params, ['registrationId', 'registration_id', 'regId']),
        ),
        action: this.parseAction(this.firstParam(params, ['action', 'mode', 'type'])) ?? undefined,
      };
    } catch {
      return null;
    }
  }

  private tryParseSearchParams(value: string): ParsedQrPayload | null {
    if (!value.includes('=')) {
      return null;
    }

    const params = new URLSearchParams(value);
    const verifyCode = this.firstParam(params, [
      'verifyCode',
      'qrCodeToken',
      'qrToken',
      'token',
      'code',
    ]);
    const hasActivityId = ['activityId', 'activity_id', 'actId'].some((key) => params.has(key));
    const hasRegistrationId = ['registrationId', 'registration_id', 'regId'].some((key) =>
      params.has(key),
    );

    if (!verifyCode && !hasActivityId && !hasRegistrationId) {
      return null;
    }

    return {
      verifyCode: verifyCode || value,
      activityId: this.numberFromValue(
        this.firstParam(params, ['activityId', 'activity_id', 'actId']),
      ),
      registrationId: this.numberFromValue(
        this.firstParam(params, ['registrationId', 'registration_id', 'regId']),
      ),
      action: this.parseAction(this.firstParam(params, ['action', 'mode', 'type'])) ?? undefined,
    };
  }

  private readString(payload: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
    }

    return null;
  }

  private readNumber(payload: Record<string, unknown>, keys: string[]): number | undefined {
    for (const key of keys) {
      const value = this.numberFromValue(payload[key]);
      if (value !== undefined) {
        return value;
      }
    }

    return undefined;
  }

  private numberFromValue(value: unknown): number | undefined {
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
  }

  private firstParam(params: URLSearchParams, keys: string[]): string | null {
    for (const key of keys) {
      const value = params.get(key);
      if (value?.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private lastPathSegment(pathname: string): string | null {
    const segment = pathname
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean)
      .pop();
    return segment || null;
  }

  private parseAction(value: string | null | undefined): QrAction | null {
    const normalized = value
      ?.trim()
      .toLowerCase()
      .replace(/[_\s-]/g, '');
    if (!normalized) {
      return null;
    }

    if (normalized.includes('checkout') || normalized === 'out') {
      return 'CHECK_OUT';
    }
    if (normalized.includes('checkin') || normalized === 'in') {
      return 'CHECK_IN';
    }

    return null;
  }

  private successMessage(action: QrAction, rawMessage?: string): string {
    const normalized = this.normalizeText(rawMessage);
    if (normalized.includes('da check in')) {
      return 'Bạn đã check-in hoạt động này trước đó. Sau khi hoàn thành, hãy quét lại QR để check-out.';
    }
    if (normalized.includes('da check out')) {
      return 'Bạn đã check-out hoạt động này trước đó. Có thể tiếp tục xác minh khuôn mặt nếu hệ thống yêu cầu.';
    }

    return action === 'CHECK_OUT'
      ? 'Check-out thành công. Bạn có thể xác minh khuôn mặt để mở bước nộp minh chứng.'
      : 'Check-in thành công. Sau khi hoàn thành hoạt động, quét lại QR của BTC để check-out.';
  }

  private resolveErrorMessage(error: unknown, triedMultipleActivities: boolean): string {
    if (triedMultipleActivities) {
      return 'Mã QR không khớp với các hoạt động đang đủ điều kiện điểm danh của bạn.';
    }

    const errorMessage = this.extractErrorMessage(error);
    const normalized = this.normalizeText(errorMessage);

    if (normalized.includes('chua dang ky')) {
      return 'Bạn chưa đăng ký hoạt động trong mã QR này nên không thể điểm danh.';
    }
    if (normalized.includes('phai check in')) {
      return 'Bạn cần check-in trước khi check-out.';
    }
    if (normalized.includes('da huy')) {
      return 'Đăng ký của bạn đã bị hủy nên không thể điểm danh.';
    }
    if (normalized.includes('khong hop le') || normalized.includes('khong thuoc')) {
      return 'Mã QR không hợp lệ hoặc không còn đúng với hoạt động này.';
    }

    return errorMessage || 'Không thể xử lý mã QR. Vui lòng thử lại hoặc liên hệ BTC.';
  }

  private normalizeText(value: string | undefined | null): string {
    return (value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const responseMessage = error.error?.message;
      return typeof responseMessage === 'string' ? responseMessage : error.message || '';
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      return typeof message === 'string' ? message : '';
    }

    return '';
  }
}
