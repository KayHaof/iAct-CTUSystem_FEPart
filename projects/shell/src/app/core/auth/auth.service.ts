import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './auth.config';
import { UserService } from '@my-mfe/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private oauthService = inject(OAuthService);
  private userService = inject(UserService);

  constructor() {
    this.oauthService.configure(authConfig);
  }

  public initLogin(): Promise<void> {
    return this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      if (this.oauthService.hasValidAccessToken()) {
        console.log('[AuthService] Token hợp lệ!');

        this.oauthService.setupAutomaticSilentRefresh();

        this.userService.getMyInfo().subscribe({
          next: () => console.log('Đã lấy và lưu thông tin User vào Signal!'),
          error: (err) => console.error('Lỗi lấy User Info:', err),
        });
      } else {
        console.log('[AuthService] Chưa đăng nhập.');
      }
    });
  }
}
