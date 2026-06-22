import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '@my-mfe/interface';
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
    <div class="w-full bg-slate-50 p-4 sm:p-6">
      <div class="mx-auto max-w-2xl">
        <!-- Header -->
        <div class="mb-6">
          <p class="mb-1 text-xs font-bold uppercase tracking-widest text-blue-600">
            Truyền thông tức thời
          </p>
          <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Gửi thông báo khẩn cấp</h1>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            Gửi thông tin quan trọng đến đúng nhóm sinh viên.
          </p>
        </div>

        <!-- Form -->
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div class="space-y-5">
            <!-- Title -->
            <div>
              <label for="urgentTitle" class="block text-sm font-bold text-slate-700 mb-2">
                Tiêu đề <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="urgentTitle"
                [(ngModel)]="form.title"
                placeholder="Ví dụ: Thông báo thay đổi thời gian hoạt động"
                class="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <!-- Message -->
            <div>
              <label for="urgentMessage" class="block text-sm font-bold text-slate-700 mb-2">
                Nội dung <span class="text-red-500">*</span>
              </label>
              <textarea
                id="urgentMessage"
                [(ngModel)]="form.message"
                rows="4"
                placeholder="Viết nội dung thông báo..."
                class="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              ></textarea>
            </div>

            <!-- Priority -->
            <div>
              <span class="mb-2 block text-sm font-bold text-slate-700">Mức độ ưu tiên</span>
              <div class="flex flex-col gap-3 sm:flex-row">
                <label
                  class="flex-1 flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer transition hover:border-blue-400"
                  [class.border-blue-400]="form.priority === 1"
                  [class.bg-blue-50]="form.priority === 1"
                >
                  <input type="radio" [(ngModel)]="form.priority" [value]="1" class="w-4 h-4" />
                  <span class="text-sm font-medium">Bình thường</span>
                </label>
                <label
                  class="flex-1 flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer transition hover:border-orange-400"
                  [class.border-orange-400]="form.priority === 2"
                  [class.bg-orange-50]="form.priority === 2"
                >
                  <input type="radio" [(ngModel)]="form.priority" [value]="2" class="w-4 h-4" />
                  <span class="text-sm font-medium">Khẩn cấp</span>
                </label>
              </div>
            </div>

            <!-- Target Type -->
            <div>
              <label for="urgentTarget" class="mb-2 block text-sm font-bold text-slate-700"
                >Gửi đến</label
              >
              <select
                id="urgentTarget"
                [(ngModel)]="form.targetType"
                class="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL_DEPARTMENT">Toàn bộ sinh viên</option>
                <option value="ACTIVITY">Sinh viên đăng ký hoạt động</option>
                <option value="CLASS">Theo lớp học</option>
              </select>
            </div>

            <!-- Activity ID (if ACTIVITY) -->
            @if (form.targetType === 'ACTIVITY') {
              <div>
                <label for="urgentActivity" class="mb-2 block text-sm font-bold text-slate-700"
                  >Mã hoạt động</label
                >
                <input
                  id="urgentActivity"
                  type="number"
                  [(ngModel)]="form.activityId"
                  placeholder="Nhập mã hoạt động"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none transition"
                />
              </div>
            }

            <!-- Class ID (if CLASS) -->
            @if (form.targetType === 'CLASS') {
              <div>
                <label for="urgentClass" class="mb-2 block text-sm font-bold text-slate-700"
                  >Mã lớp</label
                >
                <input
                  id="urgentClass"
                  type="number"
                  [(ngModel)]="form.targetId"
                  placeholder="Nhập mã lớp"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none transition"
                />
              </div>
            }
          </div>

          <!-- Actions -->
          <div
            class="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-end"
          >
            <button
              type="button"
              (click)="cancel()"
              class="min-h-11 rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              (click)="send()"
              [disabled]="isSending() || !isValid()"
              class="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              @if (isSending()) {
                <div
                  class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                ></div>
                Đang gửi...
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Gửi thông báo
              }
            </button>
          </div>
        </div>

        <!-- Recent Notifications -->
        @if (recentResults().length > 0) {
          <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h3 class="mb-4 text-sm font-bold text-slate-700">Kết quả gửi gần đây</h3>
            <div class="space-y-3">
              @for (r of recentResults(); track r.title) {
                <div class="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center"
                    [class]="r.count > 0 ? 'bg-green-100' : 'bg-red-100'"
                  >
                    @if (r.count > 0) {
                      <svg
                        class="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    } @else {
                      <svg
                        class="w-4 h-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    }
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-slate-700">{{ r.title }}</p>
                    <p class="truncate text-xs text-slate-500">{{ r.message }}</p>
                  </div>
                  @if (r.count > 0) {
                    <span class="shrink-0 text-sm font-bold text-green-600">{{ r.count }} SV</span>
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
