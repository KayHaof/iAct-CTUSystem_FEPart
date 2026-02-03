import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header
      style="background-color: #3f51b5; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center;"
    >
      <div style="font-weight: bold; font-size: 1.2rem;">Native Federation Shell</div>

      <div>
        @if (!isLoggedIn) {
          <button
            (click)="login()"
            style="background: white; color: #3f51b5; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;"
          >
            Đăng nhập
          </button>
        }

        @if (isLoggedIn) {
          <span style="margin-right: 15px;">
            Xin chào, <strong>{{ username }}</strong>
          </span>
          <button
            (click)="logout()"
            style="background: transparent; border: 1px solid white; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer;"
          >
            Đăng xuất
          </button>
        }
      </div>
    </header>
  `,
})
export class HeaderComponent implements OnInit {
  private readonly keycloak = inject(Keycloak);

  isLoggedIn = false;
  username = '';

  async ngOnInit() {
    this.isLoggedIn = this.keycloak.authenticated || false;

    if (this.isLoggedIn) {
      try {
        const profile = await this.keycloak.loadUserProfile();
        console.log('Username = ', profile.username);
        this.username = profile.username || 'User';

        console.log('=== Access Token (Gửi kèm API) ===');
        console.log(this.keycloak.token);

        console.log('=== Token Parsed (Dữ liệu đã giải mã) ===');
        console.log(this.keycloak.tokenParsed);
      } catch (error) {
        console.error('Lỗi lấy profile:', error);
      }
    }
  }

  login() {
    this.keycloak.login();
  }

  logout() {
    this.keycloak.logout({
      redirectUri: window.location.origin,
    });
  }
}
