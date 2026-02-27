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

        // 1. GỌI API ĐỒNG BỘ TRƯỚC (SYNC)
        this.userService.syncUser().subscribe({
          next: (syncRes) => {
            console.log('[AuthService] Kết quả đồng bộ:', syncRes.message);

            // 2. ĐỒNG BỘ XONG THÌ MỚI LẤY THÔNG TIN VÀ LƯU VÀO SIGNAL
            this.userService.getMyInfo().subscribe({
              next: () => console.log('[AuthService] Đã lấy và lưu thông tin User vào Signal!'),
              error: (err) => console.error('[AuthService] Lỗi lấy User Info:', err),
            });
          },
          error: (syncErr) => {
            console.error('[AuthService] Lỗi khi đồng bộ User:', syncErr);

            this.userService.getMyInfo().subscribe({
              next: () => console.log('[AuthService] Đã lấy được User Info dù Sync báo lỗi!'),
              error: (err) =>
                console.error('[AuthService] Lỗi lấy User Info (sau khi Sync lỗi):', err),
            });
          },
        });
      } else {
        console.log('[AuthService] Chưa đăng nhập.');
      }
    });
  }
}
