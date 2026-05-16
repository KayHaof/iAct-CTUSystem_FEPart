import { Component, OnInit, computed, inject } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';

import { HeaderComponent } from '../header/header.component';
import { MenuItem, SidebarComponent } from '../sidebar/sidebar.component';
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
    const role = this.userService.currentUser()?.roleType;

    if (role === 2) {
      return [
        { label: 'Tổng quan', link: '/admin/dashboard', icon: 'bi bi-grid-fill' },
        { label: 'Quản lý hoạt động', link: '/admin/org/activities', icon: 'bi bi-calendar-plus' },
        { label: 'Duyệt minh chứng', link: '/admin/org/approvals', icon: 'bi bi-check2-square' },
        { label: 'Quản lý sinh viên', link: '/admin/org/students', icon: 'bi bi-people' },
      ];
    }

    if (role === 3) {
      return [
        { label: 'Tổng quan', link: '/admin/dashboard', icon: 'bi bi-grid-fill' },
        { label: 'Quản lý người dùng', link: '/admin/user-management', icon: 'bi bi-person-video3' },
        {
          label: 'Duyệt hoạt động',
          link: '/admin/activity-moderation',
          icon: 'bi bi-calendar-event-fill',
        },
        { label: 'Quản lý học kỳ', link: '/admin/semesters', icon: 'bi bi-calendar-range' },
        { label: 'Danh mục ĐRL', link: '/admin/categories', icon: 'bi bi-diagram-3-fill' },
        { label: 'Khoa/Trường/Viện', link: '/admin/departments', icon: 'bi bi-building-fill' },
        { label: 'Chuyên ngành', link: '/admin/majors', icon: 'bi bi-mortarboard-fill' },
        { label: 'Dữ liệu nền', link: '/admin/master-data', icon: 'bi bi-database-fill' },
        { label: 'Cài đặt hệ thống', link: '/admin/settings', icon: 'bi bi-sliders' },
      ];
    }

    return [];
  });

  ngOnInit() {
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
