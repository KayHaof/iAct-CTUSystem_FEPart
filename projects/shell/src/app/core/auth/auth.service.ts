import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './auth.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private oauthService = inject(OAuthService);

  constructor() {
    this.configure();
  }

  private configure() {
    this.oauthService.configure(authConfig);
    this.oauthService.setupAutomaticSilentRefresh();
  }

  public initLogin(): Promise<void> {
    return this.oauthService
      .loadDiscoveryDocumentAndTryLogin()
      .then(() => {
        if (this.oauthService.hasValidAccessToken()) {
          console.log('[AuthService] Đã khôi phục Token thành công!');
        } else {
          console.log('[AuthService] Chưa có Token hợp lệ.');
        }
      })
      .catch((err) => {
        console.error('[AuthService] Lỗi khởi tạo:', err);
      });
  }

  public getAccessToken() {
    return this.oauthService.getAccessToken();
  }
}
