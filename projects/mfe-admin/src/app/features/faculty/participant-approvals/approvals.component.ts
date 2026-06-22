import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-approvals',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto w-full max-w-6xl space-y-5">
      <header
        class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div class="min-w-0">
          <p class="mb-1 text-xs font-bold uppercase tracking-widest text-blue-600">
            Khoa/Trường/Viện
          </p>
          <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Duyệt minh chứng sinh viên</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Kiểm tra minh chứng tham gia hoạt động trước khi ghi nhận kết quả rèn luyện.
          </p>
        </div>
        <span
          class="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-700"
        >
          0 hồ sơ chờ duyệt
        </span>
      </header>

      <div
        class="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center shadow-sm sm:px-8 sm:py-20"
      >
        <span
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600"
          aria-hidden="true"
        >
          <i class="bi bi-file-earmark-check"></i>
        </span>
        <h2 class="mt-5 text-lg font-bold text-slate-900">Chưa có minh chứng cần duyệt</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Hồ sơ sinh viên gửi lên sẽ xuất hiện tại đây sau khi dữ liệu được đồng bộ.
        </p>
      </div>
    </section>
  `,
})
export class ApprovalsComponent {}
