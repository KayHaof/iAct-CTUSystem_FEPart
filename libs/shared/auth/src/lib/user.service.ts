import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { OAuthService } from 'angular-oauth2-oidc';
import { Observable, catchError, of, tap } from 'rxjs';
import { ApiResponse, ChangePasswordDto, UserInfo } from '@my-mfe/interface';

export interface StudentFaceEmbeddingRequest {
  referenceImageUrl: string;
  referenceImagePublicId?: string;
}

export interface StudentFaceEmbeddingResponse {
  userId: number;
  referenceImageUrl: string;
  referenceImagePublicId?: string;
  vectorSize?: number;
  modelName?: string;
  detectorBackend?: string;
  normalizationMethod?: string;
  distanceMetric?: string;
  qualityScore?: number;
  faceConfidence?: number;
  embeddingVersion?: number;
  status?: number;
  lastVerifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  revokedAt?: string;
  revokedReason?: string;
}

const RESOURCE_NOT_EXISTED_CODE = 1008;

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly oauthService = inject(OAuthService);

  private readonly baseUrl = 'http://localhost:8080/user/api/v1/users';
  private readonly profileBaseUrl = 'http://localhost:8080/user/api/v1/user-profiles';

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

  getMyFaceEmbedding(): Observable<ApiResponse<StudentFaceEmbeddingResponse>> {
    return this.http
      .get<ApiResponse<StudentFaceEmbeddingResponse>>(
        `${this.profileBaseUrl}/me/face-embedding/active`,
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404 && error.error?.code === RESOURCE_NOT_EXISTED_CODE) {
            return of({
              code: RESOURCE_NOT_EXISTED_CODE,
              message: error.error?.message || 'Sinh viên chưa có ảnh xác thực AI.',
              timestamp: Date.now(),
            } as ApiResponse<StudentFaceEmbeddingResponse>);
          }

          throw error;
        }),
      );
  }

  upsertMyFaceEmbedding(
    data: StudentFaceEmbeddingRequest,
  ): Observable<ApiResponse<StudentFaceEmbeddingResponse>> {
    return this.http.put<ApiResponse<StudentFaceEmbeddingResponse>>(
      `${this.profileBaseUrl}/me/face-embedding`,
      data,
    );
  }

  deactivateAccount(id: number | string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/${id}`);
  }
}
