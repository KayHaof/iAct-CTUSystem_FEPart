import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from 'interface';
import { AlertService } from '@my-mfe/ui';

interface UrgentNotificationRequest {
  title: string;
  message: string;
  priority: number;
  targetType: 'ALL_DEPARTMENT' | 'ACTIVITY' | 'CLASS';
  targetId?: number;
  activityId?: number;
  userIds?: string[];
}

@Component({
  selector: 'app-urgent-notification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50 p-6">
      <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-slate-800">Gui thong bao khan cap</h1>
          <p class="text-slate-500 mt-1">Gui thong bao nhanh chong den sinh vien</p>
        </div>

        <!-- Form -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div class="space-y-5">
            <!-- Title -->
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">
                Tieu de <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="form.title"
                placeholder="VD: Thong bao hoat dong muon"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none transition"
              />
            </div>

            <!-- Message -->
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">
                Noi dung <span class="text-red-500">*</span>
              </label>
              <textarea
                [(ngModel)]="form.message"
                rows="4"
                placeholder="Viet noi dung thong bao..."
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none transition resize-none"
              ></textarea>
            </div>

            <!-- Priority -->
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Muc do uu tien</label>
              <div class="flex gap-3">
                <label class="flex-1 flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer transition hover:border-blue-400"
                       [class.border-blue-400]="form.priority === 1"
                       [class.bg-blue-50]="form.priority === 1">
                  <input type="radio" [(ngModel)]="form.priority" [value]="1" class="w-4 h-4" />
                  <span class="text-sm font-medium">Binh thuong</span>
                </label>
                <label class="flex-1 flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer transition hover:border-orange-400"
                       [class.border-orange-400]="form.priority === 2"
                       [class.bg-orange-50]="form.priority === 2">
                  <input type="radio" [(ngModel)]="form.priority" [value]="2" class="w-4 h-4" />
                  <span class="text-sm font-medium">Khan cap</span>
                </label>
              </div>
            </div>

            <!-- Target Type -->
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Gui den</label>
              <select
                [(ngModel)]="form.targetType"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none transition"
              >
                <option value="ALL_DEPARTMENT">Toan bo sinh vien</option>
                <option value="ACTIVITY">Sinh vien dang ky hoat dong</option>
                <option value="CLASS">Theo lop hoc</option>
              </select>
            </div>

            <!-- Activity ID (if ACTIVITY) -->
            @if (form.targetType === 'ACTIVITY') {
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Ma hoat dong</label>
                <input
                  type="number"
                  [(ngModel)]="form.activityId"
                  placeholder="Nhap ma hoat dong"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none transition"
                />
              </div>
            }

            <!-- Class ID (if CLASS) -->
            @if (form.targetType === 'CLASS') {
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Ma lop</label>
                <input
                  type="number"
                  [(ngModel)]="form.targetId"
                  placeholder="Nhap ma lop"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none transition"
                />
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
            <button
              type="button"
              (click)="cancel()"
              class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition">
              Huy bo
            </button>
            <button
              type="button"
              (click)="send()"
              [disabled]="isSending() || !isValid()"
              class="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2">
              @if (isSending()) {
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Dang gui...
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
                Gui thong bao
              }
            </button>
          </div>
        </div>

        <!-- Recent Notifications -->
        @if (recentResults().length > 0) {
          <div class="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 class="text-sm font-bold text-slate-700 mb-4">Ket qua gui gan day</h3>
            <div class="space-y-3">
              @for (r of recentResults(); track r.title) {
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center" [class]="r.count > 0 ? 'bg-green-100' : 'bg-red-100'">
                    @if (r.count > 0) {
                      <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    } @else {
                      <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    }
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-700">{{ r.title }}</p>
                    <p class="text-xs text-slate-500">{{ r.message }}</p>
                  </div>
                  @if (r.count > 0) {
                    <span class="ml-auto text-sm font-bold text-green-600">{{ r.count }} SV</span>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class UrgentNotificationComponent {
  private http = inject(HttpClient);
  private alertService = inject(AlertService);

  private baseUrl = 'http://localhost:8080';
  private apiUrl = `${this.baseUrl}/notification/api/v1`;

  isSending = signal(false);
  recentResults = signal<{ title: string; message: string; count: number }[]>([]);

  form: UrgentNotificationRequest = {
    title: '',
    message: '',
    priority: 1,
    targetType: 'ALL_DEPARTMENT',
  };

  isValid(): boolean {
    return !!(this.form.title.trim() && this.form.message.trim());
  }

  send(): void {
    if (!this.isValid()) return;
    this.isSending.set(true);

    const payload: UrgentNotificationRequest = { ...this.form };

    this.http.post<ApiResponse<number>>(`${this.apiUrl}/notifications/urgent`, payload).subscribe({
      next: (res) => {
        this.isSending.set(false);
        const count = res.data || 0;
        this.alertService.success(`Da gui thong bao den ${count} sinh vien!`);
        this.recentResults.update((prev) => [
          { title: this.form.title, message: this.form.message, count },
          ...prev.slice(0, 4),
        ]);
        this.form.title = '';
        this.form.message = '';
      },
      error: (err) => {
        this.isSending.set(false);
        this.alertService.error(err.error?.message || 'Loi khi gui thong bao!');
      },
    });
  }

  cancel(): void {
    this.form.title = '';
    this.form.message = '';
    this.form.priority = 1;
    this.form.targetType = 'ALL_DEPARTMENT';
  }
}
