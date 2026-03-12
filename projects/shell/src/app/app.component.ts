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
    effect(() => {
      const userInfo = this.userService.currentUser();

      if (userInfo) {
        const nativePath = window.location.pathname;
        console.log('User Info loaded. Native Path:', nativePath);

        const isAtRoot = nativePath === '/' || nativePath === '/admin' || nativePath === '/admin/';

        if (userInfo.roleType === 2 || userInfo.roleType === 3) {
          if (isAtRoot) {
            console.log('Redirecting Admin to dashboard...');
            this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
          }
        } else if (nativePath === '/') {
          console.log('Redirecting Student to dashboard...');
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        }

        this.webSocketService.initConnection();
        this.webSocketService
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
        });
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
