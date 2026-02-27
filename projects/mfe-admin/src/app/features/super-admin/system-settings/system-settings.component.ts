import { Component } from '@angular/core';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  template: `
    <div class="p-8">
      <div class="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
        <h2 class="text-2xl font-bold text-red-700 flex items-center gap-3">
          <i class="bi bi-gear-wide-connected"></i> Cài đặt Hệ thống
        </h2>
        <p class="text-red-600 mt-2 font-medium">
          Khu vực tuyệt mật! Nếu bạn thấy dòng này, bạn đích thị là Super Admin quyền lực nhất hệ
          thống. 😎
        </p>

        <div class="mt-8 space-y-4">
          <button
            class="bg-white border border-red-300 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition-colors w-full md:w-auto"
          >
            Xóa toàn bộ cache hệ thống
          </button>
          <button
            class="bg-white border border-red-300 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition-colors w-full md:w-auto ml-0 md:ml-3"
          >
            Đóng cổng đăng ký toàn trường
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SystemSettingsComponent {
  // Logic màn hình cài đặt tuyệt mật
}
