import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { OAuthService } from 'angular-oauth2-oidc';
import { tap, Observable } from 'rxjs';
import { ApiResponse, UserInfo, ChangePasswordDto } from 'interface';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private oauthService = inject(OAuthService);

  private baseUrl = 'http://localhost:8080/identity/api/v1/users';

  // --- State Management ---
  currentUser = signal<UserInfo | null>(null);

  public getUserRoles(): string[] {
    try {
      const token = this.oauthService.getAccessToken();
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload?.realm_access?.roles || [];
      }
    } catch (e) {
      console.error('[UserService] Lỗi decode token lấy Role:', e);
    }
    return [];
  }

  isAdmin = computed<boolean>(() => this.currentUser()?.roleType === 3);
  isStudent = computed<boolean>(() => this.currentUser()?.roleType === 1);
  isDepartment = computed<boolean>(() => this.currentUser()?.roleType === 2);

  // --- API Cá Nhân (Me) ---
  getMyInfo(): Observable<ApiResponse<UserInfo>> {
    return this.http.get<ApiResponse<UserInfo>>(`${this.baseUrl}/my-info`).pipe(
      tap((response) => {
        if (response.result) {
          this.currentUser.set(response.result);
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

  getUserById(id: string | number): Observable<ApiResponse<UserInfo>> {
    return this.http.get<ApiResponse<UserInfo>>(`${this.baseUrl}/${id}`);
  }

  updateProfile(id: number | string, data: Partial<UserInfo>): Observable<ApiResponse<UserInfo>> {
    return this.http.put<ApiResponse<UserInfo>>(`${this.baseUrl}/${id}`, data);
  }

  deactivateAccount(id: number | string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/${id}`);
  }
}
