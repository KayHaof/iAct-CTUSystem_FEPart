import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap, Observable } from 'rxjs';

// --- 1. Interface Dữ Liệu
export interface UserInfo {
  id: number;
  keycloakId: string;
  username: string;
  email: string;
  roleType: number; // 1=student, 2=department, 3=admin
  status: number; // 1=active, 0=inactive, 2=locked

  studentCode?: string;

  classId?: number;
  departmentId?: number;
  classCode?: string;
  departmentName?: string;

  fullName: string;
  birthday?: string; // yyyy-MM-dd
  gender?: number;
  phone?: string;
  address?: string;

  avatarUrl?: string;
  createdAt?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface ClassInfo {
  id: number;
  name: string;
  classCode: string;
  departmentId: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface CreateUserDto extends Partial<UserInfo> {
  password?: string;
}

export interface ChangePasswordDto {
  currentPassword?: string;
  newPassword?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  // Nhớ kiểm tra lại cổng và đường dẫn API thực tế của ní nhé
  private baseUrl = 'http://localhost:8080/identity/api/v1/users';
  private metaUrl = 'http://localhost:8080/identity/api/v1';

  // --- 2. State Management ---
  currentUser = signal<UserInfo | null>(null);

  isAdmin = computed<boolean>(() => this.currentUser()?.roleType === 3);
  isStudent = computed<boolean>(() => this.currentUser()?.roleType === 1);
  isDepartment = computed<boolean>(() => this.currentUser()?.roleType === 2);

  // --- 3. API Cá Nhân (Me) ---
  getMyInfo(): Observable<ApiResponse<UserInfo>> {
    return this.http.get<ApiResponse<UserInfo>>(`${this.baseUrl}/my-info`).pipe(
      tap((response) => {
        const user = response.result;
        if (user) {
          console.log('User fetched:', user);
          this.currentUser.set(user);
        }
      }),
    );
  }

  updateMyProfile(data: Partial<UserInfo>): Observable<ApiResponse<UserInfo>> {
    return this.http.put<ApiResponse<UserInfo>>(`${this.baseUrl}/my-profile`, data).pipe(
      tap((res) => {
        if (res.result) {
          this.currentUser.set(res.result);
        }
      }),
    );
  }

  changeMyPassword(data: ChangePasswordDto): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/my-password`, data);
  }

  // --- 4. API Danh Mục ---
  getAllDepartments(): Observable<ApiResponse<Department[]>> {
    return this.http.get<ApiResponse<Department[]>>(`${this.metaUrl}/departments`);
  }

  getClasses(departmentId?: number): Observable<ApiResponse<ClassInfo[]>> {
    let params = new HttpParams();
    if (departmentId) {
      params = params.set('departmentId', departmentId);
    }
    return this.http.get<ApiResponse<ClassInfo[]>>(`${this.metaUrl}/classes`, { params });
  }

  // --- 5. Các API Quản Trị (Admin & Helper) ---
  getUsers(page: number, size: number, keyword?: string): Observable<ApiResponse<UserInfo[]>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword) params = params.set('keyword', keyword);
    return this.http.get<ApiResponse<UserInfo[]>>(this.baseUrl, { params });
  }

  getUserById(id: string | number): Observable<ApiResponse<UserInfo>> {
    return this.http.get<ApiResponse<UserInfo>>(`${this.baseUrl}/${id}`);
  }

  getUserByEmail(email: string): Observable<ApiResponse<UserInfo>> {
    const params = new HttpParams().set('email', email);
    return this.http.get<ApiResponse<UserInfo>>(`${this.baseUrl}/search`, { params });
  }

  createUser(user: CreateUserDto): Observable<ApiResponse<UserInfo>> {
    return this.http.post<ApiResponse<UserInfo>>(this.baseUrl, user);
  }

  updateProfile(id: number | string, data: Partial<UserInfo>): Observable<ApiResponse<UserInfo>> {
    return this.http.put<ApiResponse<UserInfo>>(`${this.baseUrl}/${id}`, data);
  }

  deleteUser(id: string | number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  deactivateAccount(id: number | string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/${id}`);
  }

  toggleUserStatus(id: string | number, status: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/${id}/status`, { status });
  }

  syncUser(): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/sync`, {});
  }
}
