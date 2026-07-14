import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { ApiResponse } from '@my-mfe/interface';
import { LoadingBarComponent } from '../../components/loading-bar/loading-bar.component';
import { LayoutService } from '../../layout/layout.service';
import { LoadingService } from '../../services/loading.service';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { MenuItem, SidebarComponent } from '../sidebar/sidebar.component';

interface RepresentativeActivityPermission {
  canCreateActivity: boolean;
}

@Component({
  selector: 'lib-app-student-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, FooterComponent, LoadingBarComponent],
  templateUrl: './student-layout.component.html',
  styleUrls: ['./student-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentLayoutComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private loadingService = inject(LoadingService);
  private layoutService = inject(LayoutService);
  private readonly representativePermissionUrl =
    'http://localhost:8080/user/api/v1/class-representatives/me/activity-permission';

  readonly isMobileMenuOpen = this.layoutService.isMobileMenuOpen;

  private readonly proposalMenu: MenuItem = {
    label: 'Đăng ký tổ chức',
    link: '/activity-proposal',
    icon: 'bi bi-send-plus',
  };

  private readonly proposalManagementMenu: MenuItem = {
    label: 'Hoạt động đã gửi',
    link: '/activity-proposals',
    icon: 'bi bi-kanban',
  };

  private readonly baseStudentMenus: MenuItem[] = [
    { label: 'Tổng quan', link: '/dashboard', icon: 'bi bi-grid-fill' },
    { label: 'Cộng hoạt động', link: '/activity-hub', icon: 'bi bi-calendar3' },
    { label: 'Quản lý hoạt động', link: '/my-records', icon: 'bi bi-person-lines-fill' },
    { label: 'Khiếu nại hoạt động', link: '/complaints', icon: 'bi bi-chat-left-text' },
    { label: 'Điểm rèn luyện', link: '/point-management', icon: 'bi bi-star-fill' },
    { label: 'Quét QR điểm danh', link: '/qr-checkin', icon: 'bi bi-qr-code-scan' },
    { label: 'Thông báo', link: '/notifications', icon: 'bi bi-bell-fill' },
    { label: 'Cài đặt ưu tiên', link: '/preferences', icon: 'bi bi-sliders' },
  ];

  readonly studentMenus = signal<MenuItem[]>(this.baseStudentMenus);

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

    this.loadRepresentativeMenuPermission();
  }

  closeMobileMenu() {
    this.layoutService.closeMobileMenu();
  }

  private loadRepresentativeMenuPermission(): void {
    this.http
      .get<ApiResponse<RepresentativeActivityPermission>>(this.representativePermissionUrl)
      .subscribe({
        next: (response) => {
          if (!response.data?.canCreateActivity) return;

          this.studentMenus.set([
            this.baseStudentMenus[0],
            this.baseStudentMenus[1],
            this.proposalMenu,
            this.proposalManagementMenu,
            ...this.baseStudentMenus.slice(2),
          ]);
        },
        error: () => {
          this.studentMenus.set(this.baseStudentMenus);
        },
      });
  }
}
