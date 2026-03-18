import { Component, inject, OnInit } from '@angular/core';
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

@Component({
  selector: 'lib-app-student-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, FooterComponent, LoadingBarComponent],
  templateUrl: './student-layout.component.html',
  styleUrls: ['./student-layout.component.scss'],
})
export class StudentLayoutComponent implements OnInit {
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  studentMenus: MenuItem[] = [
    { label: 'Tổng quan', link: '/dashboard', icon: 'bi bi-grid-fill' },
    { label: 'Cổng hoạt động', link: '/activity-hub', icon: 'bi bi-calendar3' },
    { label: 'Quản lý hoạt động', link: '/my-records', icon: 'bi bi-person-lines-fill' },
    { label: 'Khiếu nại', link: '/submit-proof', icon: 'bi bi-cloud-arrow-up' },
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
}
