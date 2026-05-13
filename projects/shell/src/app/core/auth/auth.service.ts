import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './auth.config';
import { UserService } from '@my-mfe/auth';

type JwtObject = Record<string, unknown>;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private oauthService = inject(OAuthService);
  private userService = inject(UserService);
  private readonly roleTypeMap: Record<number, string> = {
    1: 'student',
    2: 'department',
    3: 'admin',
  };

  constructor() {
    this.oauthService.configure(authConfig);
  }

  public getUserRoles(): string[] {
    const payload = this.getAccessTokenPayload();
    if (!payload) {
      return [];
    }

    const roles = [
      ...this.extractRoles(payload['realm_access']),
      ...this.extractResourceRoles(payload['resource_access']),
    ];

    return this.normalizeRoles(roles);
  }

  public getRoleTypeRole(): string | null {
    const roleType = this.userService.currentUser()?.roleType;
    if (typeof roleType !== 'number') {
      return null;
    }

    return this.roleTypeMap[roleType] ?? null;
  }

  public getEffectiveUserRoles(): string[] {
    return this.normalizeRoles([this.getRoleTypeRole(), ...this.getUserRoles()]);
  }

  public waitForCurrentUser(timeoutMs = 5000): Promise<boolean> {
    if (this.userService.currentUser()) {
      return Promise.resolve(true);
    }

    return new Promise<boolean>((resolve) => {
      const intervalId = setInterval(() => {
        if (this.userService.currentUser()) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          resolve(true);
        }
      }, 50);

      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        resolve(false);
      }, timeoutMs);
    });
  }

  public async initLogin(): Promise<void> {
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();

    if (!this.oauthService.hasValidAccessToken()) {
      console.log('[AuthService] Chua dang nhap.');
      return;
    }

    console.log('[AuthService] Token hop le.');
    this.oauthService.setupAutomaticSilentRefresh();

    this.userService.syncUser().subscribe({
      next: (syncResponse) => {
        console.log('[AuthService] Ket qua dong bo:', syncResponse.message);
        this.userService.getMyInfo().subscribe({
          next: () => console.log('[AuthService] Da luu thong tin user vao signal.'),
          error: (error) => console.error('[AuthService] Loi lay user info:', error),
        });
      },
      error: (syncError) => {
        console.error('[AuthService] Loi khi dong bo user:', syncError);
        this.userService.getMyInfo().subscribe({
          next: () => console.log('[AuthService] Da lay user info sau khi sync loi.'),
          error: (error) => console.error('[AuthService] Loi lay user info sau khi sync loi:', error),
        });
      },
    });
  }

  private getAccessTokenPayload(): JwtObject | null {
    try {
      const token = this.oauthService.getAccessToken();
      const payload = token?.split('.')[1];
      if (!payload) {
        return null;
      }

      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      return JSON.parse(atob(paddedBase64)) as JwtObject;
    } catch (error) {
      console.error('[AuthService] Loi decode token lay role:', error);
      return null;
    }
  }

  private extractResourceRoles(resourceAccess: unknown): string[] {
    if (!this.isJwtObject(resourceAccess)) {
      return [];
    }

    return Object.values(resourceAccess).flatMap((resource) => this.extractRoles(resource));
  }

  private extractRoles(source: unknown): string[] {
    if (!this.isJwtObject(source) || !Array.isArray(source['roles'])) {
      return [];
    }

    return source['roles'].filter((role): role is string => typeof role === 'string');
  }

  private normalizeRoles(roles: Array<string | null>): string[] {
    return Array.from(
      new Set(
        roles
          .filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
          .map((role) => role.trim().toLowerCase().replace(/^role_/, '')),
      ),
    );
  }

  private isJwtObject(value: unknown): value is JwtObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
