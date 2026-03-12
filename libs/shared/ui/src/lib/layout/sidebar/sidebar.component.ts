import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc';
import { UserService } from '@my-mfe/auth';
import { LayoutService } from '../layout.service';

interface MenuItem {
  label: string;
  link: string;
  icon: string;
  role?: number;
}

@Component({
  selector: 'lib-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  private oauthService = inject(OAuthService);
  private userService = inject(UserService);
  private layoutService = inject(LayoutService);

  get isOpen() {
    return this.layoutService.isMobileMenuOpen();
  }

  close() {
    this.layoutService.closeMobileMenu();
  }

  menuItems: MenuItem[] = [
    { label: 'Cổng hoạt động', link: '/activity-hub', icon: 'bi bi-calendar3', role: 1 }, // Cổng thông tin hoạt động chung
    { label: 'Tổng quan', link: '/dashboard', icon: 'bi bi-grid-fill', role: 1 }, // Dashboard của SV
    { label: 'Kết quả rèn luyện', link: '/my-records', icon: 'bi bi-person-lines-fill', role: 1 }, // Xem điểm & Lịch sử
    { label: 'Nộp minh chứng', link: '/submit-proof', icon: 'bi bi-cloud-arrow-up', role: 1 }, // Nộp minh chứng ngoài

    // --- DEPARTMENT (Role 2 - Khoa/Viện) ---
    { label: 'Tổng quan', link: '/admin/dashboard', icon: 'bi bi-grid-fill', role: 2 }, // Đã đổi sang /admin/
    {
      label: 'Quản lý hoạt động',
      link: '/admin/org/activities',
      icon: 'bi bi-calendar-plus',
      role: 2,
    }, // Tạo/Quản lý hoạt động
    { label: 'Duyệt minh chứng', link: '/admin/org/approvals', icon: 'bi bi-check2-square', role: 2 }, // Duyệt minh chứng
    { label: 'Quản lý sinh viên', link: '/admin/org/students', icon: 'bi bi-people', role: 2 }, // Danh sách SV khoa mình

    // --- ADMIN (Role 3 - Quản trị hệ thống) ---
    { label: 'Tổng quan', link: '/admin/dashboard', icon: 'bi bi-grid-fill', role: 3 }, // Đã đổi sang /admin/
    { label: 'Quản lý người dùng', link: '/admin/users', icon: 'bi bi-person-video3', role: 3 }, // Quản lý User/Phân quyền
    { label: 'Cấu hình hệ thống', link: '/admin/settings', icon: 'bi bi-sliders', role: 3 }, // Cấu hình học kỳ/Điểm
    { label: 'Nhập dữ liệu', link: '/admin/data', icon: 'bi bi-database-add', role: 3 }, // Import danh sách SV đầu khóa
  ];

  filteredMenuItems = computed(() => {
    const user = this.userService.currentUser();
    const userRole = user ? user.roleType : null;
    return this.menuItems.filter((item) => !item.role || item.role === userRole);
  });

  logout() {
    this.oauthService.logOut();
  }
}
