// projects/shell/src/app/layout/sidebar/sidebar.component.ts
import { Component, inject } from '@angular/core'; // 👈 Thêm inject
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc'; // 👈 Thêm import này

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  // Bây giờ inject mới hiểu OAuthService là gì
  private oauthService = inject(OAuthService);

  logout() {
    this.oauthService.logOut();
  }
}