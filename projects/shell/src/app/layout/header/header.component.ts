// projects/shell/src/app/layout/header/header.component.ts
import { Component, inject } from '@angular/core'; // 👈 Thêm inject
import { CommonModule } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc'; // 👈 Thêm import này

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  private oauthService = inject(OAuthService);

  // 🔥 KHAI BÁO CÁC BIẾN MÀ HTML ĐANG ĐÒI
  username: string = 'Student';
  userAvatar: string = 'assets/images/default-avatar.png'; // Đường dẫn ảnh mặc định

  constructor() {
    // Lấy thông tin user từ Token sau khi đăng nhập
    const claims = this.oauthService.getIdentityClaims() as any;

    if (claims) {
      // Keycloak thường trả về 'name', 'given_name' hoặc 'preferred_username'
      this.username = claims['name'] || claims['preferred_username'] || 'Student';

      // Nếu Keycloak có config trả về avatar (picture)
      if (claims['picture']) {
        this.userAvatar = claims['picture'];
      }
    }
  }
}
