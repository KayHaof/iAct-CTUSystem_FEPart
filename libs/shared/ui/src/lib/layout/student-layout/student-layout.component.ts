import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
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
import { FooterComponent } from '../footer/footer.component';
import { LoadingBarComponent } from '../../components/loading-bar/loading-bar.component';
import { LoadingService } from '../../services/loading.service';
import { LayoutService } from '../../layout/layout.service';

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
  private loadingService = inject(LoadingService);
  private layoutService = inject(LayoutService);

  isMobileMenuOpen = this.layoutService.isMobileMenuOpen;

  studentMenus: MenuItem[] = [
    { label: 'Tổng quan', link: '/dashboard', icon: 'bi bi-grid-fill' },
    { label: 'Cộng hoạt động', link: '/activity-hub', icon: 'bi bi-calendar3' },
    { label: 'Quản lý hoạt động', link: '/my-records', icon: 'bi bi-person-lines-fill' },
    { label: 'Điểm rèn luyện', link: '/point-management', icon: 'bi bi-star-fill' },
    { label: 'Quét QR điểm danh', link: '/qr-checkin', icon: 'bi bi-qr-code-scan' },
    { label: 'Khiếu nại', link: '/submit-proof', icon: 'bi bi-cloud-arrow-up' },
    { label: 'Cài đặt ưu tiên', link: '/preferences', icon: 'bi bi-sliders' },
  ];

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
