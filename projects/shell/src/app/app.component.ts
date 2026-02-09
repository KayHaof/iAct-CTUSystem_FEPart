import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './core/auth/auth.config';
import { UserService, WebSocketService } from 'shared-ui';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private oauthService = inject(OAuthService);
  private router = inject(Router);
  private userService = inject(UserService);
  private webSocketService = inject(WebSocketService);

  constructor() {
    effect(() => {
      const userInfo = this.userService.currentUser();
      if (userInfo) {
        console.log('User Info loaded (Signal):', userInfo.id);

        // Kết nối WebSocket
        this.webSocketService.initConnection();

        this.webSocketService.watchUser(userInfo.id).subscribe((message) => {
          try {
            const data = JSON.parse(message.body);
            if (data.type === 99) {
              this.handleForceLogout(data.message);
            }
          } catch (e) {
            console.error('Lỗi parse message WebSocket:', e);
          }
        });
      }
    });
  }

  ngOnInit() {
    this.configureAuth();
  }

  private configureAuth() {
    this.oauthService.configure(authConfig);

    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      if (this.oauthService.hasValidAccessToken()) {
        this.userService.getMyInfo().subscribe({
          next: () => {
            console.log('Lấy thông tin user thành công');
          },
          error: (err) => {
            console.error('Lỗi lấy User Info:', err);
            if (err.status === 403 || err.status === 401 || err.status === 400) {
              this.handleForceLogout(
                'Tài khoản của bạn đã bị khóa hoặc phiên đăng nhập không hợp lệ.',
              );
            }
          },
        });

        this.oauthService.setupAutomaticSilentRefresh();

        this.router.navigate([], {
          queryParams: {
            code: null,
            state: null,
            session_state: null,
            iss: null,
          },
          queryParamsHandling: 'merge',
        });
      }
    });
  }

  private handleForceLogout(reason: string) {
    Swal.fire({
      icon: 'error',
      title: 'Thông báo',
      text: reason || 'Tài khoản của bạn đã bị vô hiệu hóa.',
      confirmButtonText: 'Đăng nhập lại',
      confirmButtonColor: '#d33',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.performLogout();
      }
    });
  }

  private performLogout() {
    this.oauthService.logOut();
  }
}
