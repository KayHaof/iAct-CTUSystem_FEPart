import { Component, inject, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc';
import { LayoutService } from '../layout.service';

// Interface gọn nhẹ, không cần role nữa
export interface MenuItem {
  label: string;
  link: string;
  icon: string;
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
  private layoutService = inject(LayoutService);

  @Input() menuItems: MenuItem[] = [];
  @Input() theme: 'light' | 'dark' = 'light';

  get isOpen() {
    return this.layoutService.isMobileMenuOpen();
  }

  close() {
    this.layoutService.closeMobileMenu();
  }

  logout() {
    this.oauthService.logOut();
  }
}
