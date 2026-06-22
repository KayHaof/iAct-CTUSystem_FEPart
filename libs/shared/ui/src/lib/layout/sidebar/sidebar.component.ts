import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { LayoutService } from '../layout.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private oauthService = inject(OAuthService);
  private layoutService = inject(LayoutService);

  @Input() menuItems: MenuItem[] = [];
  @Input() theme: 'light' | 'dark' = 'light';

  isMobileOpen = this.layoutService.isMobileMenuOpen;

  get isOpen() {
    return this.layoutService.isMobileMenuOpen();
  }

  close() {
    this.layoutService.closeMobileMenu();
  }

  handleNavigation(event: MouseEvent) {
    const currentTarget = event.currentTarget as HTMLElement | null;
    this.close();
    window.setTimeout(() => currentTarget?.blur());
  }

  logout() {
    this.oauthService.logOut();
  }
}
