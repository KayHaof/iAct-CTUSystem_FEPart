import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  OnInit,
  computed,
  inject,
} from '@angular/core';
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
import { LayoutService } from '../../layout/layout.service';

@Component({
  selector: 'lib-app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, LoadingBarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent implements OnInit {
  @HostBinding('class') hostClass = 'admin-host';

  private router = inject(Router);
  private loadingService = inject(LoadingService);
  private userService = inject(UserService);
  private layoutService = inject(LayoutService);

  isMobileMenuOpen = this.layoutService.isMobileMenuOpen;

  adminMenus = computed<MenuItem[]>(() => {
    const role = this.userService.currentUser()?.roleType;

    if (role === 2) {
      return [
        { label: 'Tổng quan', link: '/admin/dashboard', icon: 'bi bi-grid-fill' },
        { label: 'Quản lý hoạt động', link: '/admin/org/activities', icon: 'bi bi-calendar-plus' },
        { label: 'Địa điểm đơn vị', link: '/admin/org/locations', icon: 'bi bi-building-gear' },
        { label: 'Đại diện lớp', link: '/admin/org/representatives', icon: 'bi bi-person-badge-fill' },
        { label: 'Thông báo', link: '/admin/notifications', icon: 'bi bi-bell-fill' },
      ];
    }

    if (role === 3) {
      return [
        { label: 'Tổng quan', link: '/admin/dashboard', icon: 'bi bi-grid-fill' },
        {
          label: 'Quản lý người dùng',
          link: '/admin/user-management',
          icon: 'bi bi-person-video3',
        },
        {
          label: 'Duyệt hoạt động',
          link: '/admin/activity-moderation',
          icon: 'bi bi-calendar-event-fill',
        },
        { label: 'Quản lý địa điểm', link: '/admin/locations', icon: 'bi bi-building-gear' },
        { label: 'Quản lý học kỳ', link: '/admin/semesters', icon: 'bi bi-calendar-range' },
        { label: 'Danh mục DRL', link: '/admin/categories', icon: 'bi bi-diagram-3-fill' },
        { label: 'Khoa/Truờng/Viện', link: '/admin/departments', icon: 'bi bi-building-fill' },
        { label: 'Chuyên ngành', link: '/admin/majors', icon: 'bi bi-mortarboard-fill' },
        { label: 'Lớp sinh hoạt', link: '/admin/classes', icon: 'bi bi-collection-fill' },
        { label: 'Thông báo', link: '/admin/notifications', icon: 'bi bi-bell-fill' },
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

  closeMobileMenu() {
    this.layoutService.closeMobileMenu();
  }
}
