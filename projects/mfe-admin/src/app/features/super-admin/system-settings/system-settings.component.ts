import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto w-full max-w-6xl space-y-5">
      <header
        class="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 to-sky-500 p-5 text-white shadow-md sm:p-7"
      >
        <div class="flex items-start gap-4">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl"
            aria-hidden="true"
          >
            <i class="bi bi-gear-wide-connected"></i>
          </span>
          <div class="min-w-0">
            <p class="mb-1 text-xs font-bold uppercase tracking-widest text-blue-100">
              Quản trị hệ thống
            </p>
            <h1 class="text-2xl font-bold text-white sm:text-3xl">Cài đặt hệ thống</h1>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-blue-50 sm:text-base">
              Theo dõi các nhóm cấu hình nền tảng và trạng thái sẵn sàng trước khi áp dụng thay đổi.
            </p>
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div class="flex items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
              aria-hidden="true"
            >
              <i class="bi bi-sliders"></i>
            </span>
            <div class="min-w-0">
              <h2 class="text-base font-bold text-slate-900">Cấu hình vận hành</h2>
              <p class="mt-1 text-sm leading-6 text-slate-500">
                Các tùy chọn đăng ký và vận hành toàn trường chưa được kết nối API.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled
            class="mt-5 min-h-11 w-full rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-400 disabled:cursor-not-allowed"
          >
            Chưa khả dụng
          </button>
        </article>

        <article class="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
          <div class="flex items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600"
              aria-hidden="true"
            >
              <i class="bi bi-shield-check"></i>
            </span>
            <div class="min-w-0">
              <h2 class="text-base font-bold text-slate-900">Thao tác nhạy cảm</h2>
              <p class="mt-1 text-sm leading-6 text-slate-600">
                Các thao tác ảnh hưởng toàn hệ thống sẽ chỉ hiển thị khi có đầy đủ quyền và quy
                trình xác nhận.
              </p>
            </div>
          </div>
          <p
            class="mt-5 rounded-xl border border-amber-200 bg-white/70 p-3 text-sm font-medium text-amber-800"
          >
            Hiện chưa có thao tác nào cần xử lý.
          </p>
        </article>
      </div>
    </section>
  `,
})
export class SystemSettingsComponent {}
