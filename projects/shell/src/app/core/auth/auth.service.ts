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

  public getUserRoles(): string[] {
    try {
      const token = this.oauthService.getAccessToken();
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload?.realm_access?.roles || [];
      }
    } catch (e) {
      console.error('[AuthService] Lỗi decode token lấy Role:', e);
    }
    return [];
  }

  public async initLogin(): Promise<void> {
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();
      if (this.oauthService.hasValidAccessToken()) {
          console.log('[AuthService] Token hợp lệ!');

          this.oauthService.setupAutomaticSilentRefresh();

          // 1. GỌI API ĐỒNG BỘ TRƯỚC (SYNC)
          this.userService.syncUser().subscribe({
              next: (syncRes_1) => {
                  console.log('[AuthService] Kết quả đồng bộ:', syncRes_1.message);

                  // 2. ĐỒNG BỘ XONG THÌ MỚI LẤY THÔNG TIN VÀ LƯU VÀO SIGNAL
                  this.userService.getMyInfo().subscribe({
                      next: () => console.log('[AuthService] Đã lấy và lưu thông tin User vào Signal!'),
                      error: (err_1) => console.error('[AuthService] Lỗi lấy User Info:', err_1),
                  });
              },
              error: (syncErr_1) => {
                  console.error('[AuthService] Lỗi khi đồng bộ User:', syncErr_1);

                  this.userService.getMyInfo().subscribe({
                      next: () => console.log('[AuthService] Đã lấy được User Info dù Sync báo lỗi!'),
                      error: (err_3) => console.error('[AuthService] Lỗi lấy User Info (sau khi Sync lỗi):', err_3),
                  });
              },
          });
      } else {
          console.log('[AuthService] Chưa đăng nhập.');
      }
  }
}
