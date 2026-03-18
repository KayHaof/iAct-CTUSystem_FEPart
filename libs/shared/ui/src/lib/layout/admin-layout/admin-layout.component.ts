import { Component, inject, OnInit, computed } from '@angular/core';
import {
  RouterOutlet,
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';

import { SidebarComponent, MenuItem } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { LoadingBarComponent } from '../../components/loading-bar/loading-bar.component';

import { UserService } from '@my-mfe/auth';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'lib-app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, LoadingBarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit {
  private router = inject(Router);
  private loadingService = inject(LoadingService);
  private userService = inject(UserService);

  adminMenus = computed<MenuItem[]>(() => {
    const user = this.userService.currentUser();
    const role = user?.roleType;

    if (role === 2) {
      // --- MENU CHO BAN CHỦ NHIỆM KHOA / ĐOÀN HỘI ---
      return [
        { label: 'Tổng quan', link: '/admin/dashboard', icon: 'bi bi-grid-fill' },
        { label: 'Quản lý hoạt động', link: '/admin/org/activities', icon: 'bi bi-calendar-plus' },
        { label: 'Duyệt minh chứng', link: '/admin/org/approvals', icon: 'bi bi-check2-square' },
        { label: 'Quản lý sinh viên', link: '/admin/org/students', icon: 'bi bi-people' },
      ];
    } else if (role === 3) {
      // --- MENU CHO SUPER ADMIN (CTU) ---
      return [
        { label: 'Tổng quan', link: '/admin/dashboard', icon: 'bi bi-grid-fill' },
        { label: 'User Management', link: '/admin/user-management', icon: 'bi bi-person-video3' },
        {
          label: 'Global Activities',
          link: '/admin/global-activities',
          icon: 'bi bi-calendar-event-fill',
        },
        { label: 'Master Data', link: '/admin/master-data', icon: 'bi bi-database-fill' },
        { label: 'System Settings', link: '/admin/settings', icon: 'bi bi-sliders' },
      ];
    }

    // Nếu lỡ rớt mạng hoặc chưa lấy được Role thì trả về mảng rỗng (Tránh lỗi vặt)
    return [];
  });

  ngOnInit() {
    // Logic quản lý Loading Bar khi chuyển trang (Giữ nguyên cực chuẩn)
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loadingService.show();
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loadingService.hide();
      }
    });
  }
}
