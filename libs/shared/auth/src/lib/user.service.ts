import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { OAuthService } from 'angular-oauth2-oidc';
import { Observable, tap } from 'rxjs';
import { ApiResponse, ChangePasswordDto, UserInfo } from 'interface';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly oauthService = inject(OAuthService);

  private readonly baseUrl = 'http://localhost:8080/user/api/v1/users';

  currentUser = signal<UserInfo | null>(null);

  isAdmin = computed<boolean>(() => this.currentUser()?.roleType === 3);
  isStudent = computed<boolean>(() => this.currentUser()?.roleType === 1);
  isDepartment = computed<boolean>(() => this.currentUser()?.roleType === 2);

  getUserRoles(): string[] {
    try {
      const token = this.oauthService.getAccessToken();
      if (!token) {
        return [];
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.realm_access?.roles || [];
    } catch (error) {
      console.error('[UserService] Loi decode token lay role:', error);
      return [];
    }
  }

  getMyInfo(): Observable<ApiResponse<UserInfo>> {
    return this.http.get<ApiResponse<UserInfo>>(`${this.baseUrl}/my-info`).pipe(
      tap((response) => {
        if (response.data) {
          this.currentUser.set(response.data);
        }
      }),
    );
  }

  changeMyPassword(data: ChangePasswordDto): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/my-password`, data);
  }

  syncUser(): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/sync`, {});
  }

  getUserByEmail(email: string): Observable<ApiResponse<UserInfo>> {
    const params = new HttpParams().set('email', email);
    return this.http.get<ApiResponse<UserInfo>>(`${this.baseUrl}/search`, { params });
  }

  getUserByUsername(username: string): Observable<ApiResponse<UserInfo>> {
    return this.http.get<ApiResponse<UserInfo>>(`${this.baseUrl}/username/${username}`);
  }

  getUserById(id: number | string): Observable<ApiResponse<UserInfo>> {
    return this.http.get<ApiResponse<UserInfo>>(`${this.baseUrl}/${id}`);
  }

  getFullProfile(userId: number | string): Observable<ApiResponse<UserInfo>> {
    return this.getUserById(userId);
  }

  updateProfile(userId: number | string, data: Partial<UserInfo>): Observable<ApiResponse<void>> {
    return this.http
      .put<ApiResponse<void>>(`${this.baseUrl}/${userId}`, data)
      .pipe(tap(() => this.getMyInfo().subscribe()));
  }

  deactivateAccount(id: number | string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/${id}`);
  }
}
