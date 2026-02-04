import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './core/auth/auth.config';
import { UserService } from 'shared-ui';

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

  ngOnInit() {
    this.configureAuth();
  }

  private configureAuth() {
    this.oauthService.configure(authConfig);

    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      if (this.oauthService.hasValidAccessToken()) {
        this.userService.getMyInfo().subscribe();

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
}
