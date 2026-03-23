import { Component } from '@angular/core';

@Component({
  selector: 'app-approvals',
  standalone: true,
  template: `
    <div class="p-8">
      <h2 class="text-2xl font-bold text-gray-800">Duyệt Minh Chứng Sinh Viên</h2>
      <p class="text-gray-500 mt-2">
        Khu vực này dành cho Khoa duyệt các hoạt động của sinh viên nè.
      </p>
    </div>
  `,
})
export class ApprovalsComponent {}
