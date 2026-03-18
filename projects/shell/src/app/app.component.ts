import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { UserService } from '@my-mfe/auth';
import { WebSocketService, AppNotification } from '@my-mfe/data-access-realtime';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private userService = inject(UserService);
  private webSocketService = inject(WebSocketService);
  private oauthService = inject(OAuthService);

  constructor() {
    effect((onCleanup) => {
      const userInfo = this.userService.currentUser();

      if (userInfo) {
        const nativePath = window.location.pathname;
        console.log('User Info loaded. Native Path:', nativePath, '| RoleType:', userInfo.roleType);

        const isManager = userInfo.roleType === 2 || userInfo.roleType === 3;

        if (isManager) {
          if (
            nativePath === '/' ||
            nativePath === '/dashboard' ||
            nativePath === '/admin' ||
            nativePath === '/admin/'
          ) {
            console.log('Redirecting Admin/Department to dashboard...');
            this.router.navigate(['/admin/dashboard'], { replaceUrl: true }).then();
          }
        } else {
          // Sinh viên
          if (nativePath === '/') {
            console.log('Redirecting Student to dashboard...');
            this.router.navigate(['/dashboard'], { replaceUrl: true }).then();
          }
        }

        // --- BẬT WEBSOCKET KÈM DỌN DẸP ---
        this.webSocketService.initConnection();
        const wsSubscription = this.webSocketService
          .watchUserNotification(userInfo.id)
          .subscribe((notification: AppNotification) => {
            try {
              if (notification.type === 99) {
                this.handleForceLogout(notification.message);
              }
            } catch (e) {
              console.error('Lỗi xử lý message WebSocket:', e);
            }
          });

        // Hủy luồng cũ khi effect chạy lại -> Chống lag / lặp popup
        onCleanup(() => {
          wsSubscription.unsubscribe();
        });
      }
    });
  }

  ngOnInit() {
    setTimeout(() => {
      const currentUrl = this.router.url;
      if (currentUrl.includes('code=') || currentUrl.includes('iss=')) {
        this.router.navigate([], {
          queryParams: { code: null, state: null, session_state: null, iss: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        }).then();
      }
    }, 100);
  }

  private handleForceLogout(reason: string) {
    Swal.fire({
      icon: 'error',
      title: 'Tài khoản bị vô hiệu hóa',
      text: reason || 'Tài khoản của bạn đã bị khóa bởi quản trị viên.',
      confirmButtonText: 'Đăng xuất',
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.currentUser.set(null);
        this.oauthService.logOut();
      }
    });
  }
}
