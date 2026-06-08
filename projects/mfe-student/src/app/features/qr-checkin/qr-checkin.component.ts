import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { WebSocketService, AppNotification } from '@my-mfe/data-access-realtime';
import { ApiResponse } from 'interface';

interface RegistrationQR {
  registrationId: number;
  activityId: number;
  activityTitle: string;
  qrData: string;
  checkInCode: string;
  validUntil: number;
  sessionInfo?: {
    sessionId: number;
    sessionName: string;
    checkInTime: string;
    checkOutTime: string;
  };
}

@Component({
  selector: 'app-qr-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50 p-6">
      <div class="max-w-lg mx-auto">
        <!-- Header -->
        <div class="mb-6 flex items-center gap-3">
          <button (click)="goBack()" class="p-2 rounded-lg hover:bg-slate-200 transition">
            <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <h1 class="text-xl font-bold text-slate-800">Quet QR diem danh</h1>
            <p class="text-sm text-slate-500">Quet ma QR de diem danh hoat dong</p>
          </div>
        </div>

        <!-- QR Scanner -->
        @if (!qrResult()) {
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div class="text-center">
              <div class="w-64 h-64 mx-auto bg-slate-100 rounded-xl flex items-center justify-center mb-4 overflow-hidden"
                   [class.border-2]="isScanning()"
                   [class.border-blue-500]="isScanning()"
                   #scannerContainer>
                @if (isScanning()) {
                  <div class="text-center">
                    <div class="w-48 h-48 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p class="text-slate-500 text-sm">Dang khoi dong camera...</p>
                  </div>
                } @else {
                  <div class="text-center">
                    <svg class="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h1m-11 0h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p class="text-slate-500 text-sm">Nhan nut ben duoi de bat camera</p>
                  </div>
                }
              </div>

              <div class="space-y-3">
                <button
                  (click)="startScanner()"
                  [disabled]="isScanning()"
                  class="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Quet QR
                </button>
                <button
                  (click)="manualEntry()"
                  class="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition">
                  Nhap ma thu cong
                </button>
              </div>
            </div>
          </div>

          <!-- Manual Entry Form -->
          @if (showManualEntry()) {
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <h3 class="font-semibold text-slate-800 mb-4">Nhap ma diem danh</h3>
              <input
                type="text"
                [(ngModel)]="manualCode"
                placeholder="VD: CK000123"
                class="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg tracking-widest uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              />
              <button
                (click)="submitManualCode()"
                [disabled]="!manualCode || isChecking()"
                class="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50">
                {{ isChecking() ? 'Dang kiem tra...' : 'Kiem tra ma' }}
              </button>
            </div>
          }
        }

        <!-- Check-in Success -->
        @if (qrResult()?.success) {
          <div class="bg-white rounded-xl shadow-sm border border-green-200 p-8 text-center">
            <div class="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-green-700 mb-2">Diem danh thanh cong!</h2>
            <p class="text-slate-600 mb-1">{{ qrResult()?.activityTitle }}</p>
            @if (qrResult()?.sessionName) {
              <p class="text-sm text-slate-500 mb-4">{{ qrResult()?.sessionName }}</p>
            }
            <p class="text-sm text-slate-400">Thoi gian: {{ qrResult()?.checkedInAt | date:'HH:mm - dd/MM/yyyy' }}</p>
            <button
              (click)="reset()"
              class="mt-6 px-6 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition">
              Quet tiep
            </button>
          </div>
        }

        <!-- Check-in Error -->
        @if (qrResult() && !qrResult()?.success) {
          <div class="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
            <div class="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-red-700 mb-2">Diem danh that bai</h2>
            <p class="text-slate-600 mb-4">{{ qrResult()?.message }}</p>
            <button
              (click)="reset()"
              class="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition">
              Thu lai
            </button>
          </div>
        }

        <!-- My QR Code -->
        @if (myRegistrations().length > 0 && !qrResult()) {
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 class="font-semibold text-slate-800 mb-4">Ma QR cua toi</h3>
            <div class="space-y-3">
              @for (reg of myRegistrations(); track reg.registrationId) {
                <div
                  (click)="selectRegistration(reg)"
                  class="p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition"
                  [class.border-blue-400]="selectedRegistration()?.registrationId === reg.registrationId"
                  [class.bg-blue-50]="selectedRegistration()?.registrationId === reg.registrationId">
                  <p class="font-medium text-slate-700">{{ reg.activityTitle }}</p>
                  <p class="text-sm text-slate-500 mt-1">Ma: {{ reg.checkInCode }}</p>
                </div>
              }
            </div>

            @if (selectedRegistration()) {
              <div class="mt-4 p-4 bg-slate-50 rounded-lg text-center">
                <p class="text-sm text-slate-500 mb-3">{{ selectedRegistration()!.activityTitle }}</p>
                <div class="bg-white p-4 rounded-lg inline-block">
                  <img [src]="selectedRegistration()!.qrData" alt="QR Code" class="w-48 h-48 mx-auto" />
                </div>
                <p class="text-xs text-slate-400 mt-2">Quet tai diem danh</p>
              </div>
            }
          </div>
        }

        <!-- Loading -->
        @if (isLoading()) {
          <div class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        }
      </div>
    </div>
  `,
})
export class QrCheckinComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private wsService = inject(WebSocketService);

  @ViewChild('scannerContainer') scannerContainer!: ElementRef;

  private baseUrl = 'http://localhost:8080';
  private activityApiUrl = `${this.baseUrl}/activity/api/v1`;

  isLoading = signal(true);
  isScanning = signal(false);
  isChecking = signal(false);
  showManualEntry = signal(false);
  manualCode = '';
  myRegistrations = signal<RegistrationQR[]>([]);
  selectedRegistration = signal<RegistrationQR | null>(null);
  qrResult = signal<{ success: boolean; message?: string; activityTitle?: string; sessionName?: string; checkedInAt?: string } | null>(null);
  private notifSub?: Subscription;

  ngOnInit(): void {
    this.loadMyRegistrations();
    this.initWebSocket();
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
  }

  initWebSocket(): void {
    this.wsService.initConnection();
    this.wsService.watch('/topic/notifications').subscribe({
      next: (msg: any) => {
        const appNotification = msg as AppNotification;
        if (appNotification.type === 3) {
          this.qrResult.set({
            success: true,
            activityTitle: appNotification.title,
            message: appNotification.message,
            checkedInAt: new Date().toISOString(),
          });
        }
      },
    });
  }

  loadMyRegistrations(): void {
    this.http.get<ApiResponse<any[]>>(`${this.activityApiUrl}/registrations/my-records`).subscribe({
      next: (res) => {
        const regs = (res.data || []).filter((r: any) => r.status === 0 || r.status === 1);
        const qrPromises = regs.map((r: any) =>
          this.http.get<ApiResponse<any>>(`${this.activityApiUrl}/registrations/${r.id}/qr`).toPromise()
        );
        Promise.all(qrPromises).then((results) => {
          const withQr = regs.map((r: any, i: number) => ({
            registrationId: r.id,
            activityId: r.activityId,
            activityTitle: r.activityTitle || 'Hoat dong',
            qrData: results[i]?.data || '',
            checkInCode: 'CK' + String(r.id).padStart(6, '0'),
            validUntil: 0,
          }));
          this.myRegistrations.set(withQr);
          if (withQr.length > 0) {
            this.selectedRegistration.set(withQr[0]);
          }
          this.isLoading.set(false);
        });
      },
      error: () => this.isLoading.set(false),
    });
  }

  startScanner(): void {
    this.isScanning.set(true);
  }

  manualEntry(): void {
    this.showManualEntry.set(true);
  }

  submitManualCode(): void {
    if (!this.manualCode) return;
    this.isChecking.set(true);
    const code = this.manualCode.trim().toUpperCase();
    this.http.post<ApiResponse<any>>(`${this.activityApiUrl}/attendances/verify-qr`, { verifyCode: code }).subscribe({
      next: (res) => {
        this.isChecking.set(false);
        this.qrResult.set({
          success: res.code === 200,
          message: res.message,
          activityTitle: '',
          checkedInAt: new Date().toISOString(),
        });
      },
      error: (err) => {
        this.isChecking.set(false);
        this.qrResult.set({
          success: false,
          message: err.error?.message || 'Ma khong hop le',
        });
      },
    });
  }

  selectRegistration(reg: RegistrationQR): void {
    this.selectedRegistration.set(reg);
  }

  reset(): void {
    this.qrResult.set(null);
    this.manualCode = '';
    this.showManualEntry.set(false);
  }

  goBack(): void {
    this.router.navigate(['/my-records']);
  }
}
