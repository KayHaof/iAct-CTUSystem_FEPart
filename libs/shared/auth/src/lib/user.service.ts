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

  avtUrl?: string;
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

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

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

  // --- 4. API Danh Mục

  // Lấy tất cả khoa
  getAllDepartments(): Observable<ApiResponse<Department[]>> {
    return this.http.get<ApiResponse<Department[]>>(`${this.metaUrl}/departments`);
  }

  // Lấy danh sách lớp (Có thể lọc theo khoa nếu cần)
  getClasses(departmentId?: number): Observable<ApiResponse<ClassInfo[]>> {
    let params = new HttpParams();
    if (departmentId) {
      params = params.set('departmentId', departmentId);
    }
    return this.http.get<ApiResponse<ClassInfo[]>>(`${this.metaUrl}/classes`, { params });
  }

  // --- 5. Các API Quản Trị (Admin) ---
  getUsers(page: number, size: number, keyword?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword) params = params.set('keyword', keyword);
    return this.http.get<ApiResponse<any>>(this.baseUrl, { params });
  }

  getUserById(id: string): Observable<ApiResponse<UserInfo>> {
    return this.http.get<ApiResponse<UserInfo>>(`${this.baseUrl}/${id}`);
  }

  createUser(user: CreateUserDto): Observable<ApiResponse<UserInfo>> {
    return this.http.post<ApiResponse<UserInfo>>(this.baseUrl, user);
  }

  updateUser(id: string, data: Partial<UserInfo>): Observable<ApiResponse<UserInfo>> {
    return this.http.put<ApiResponse<UserInfo>>(`${this.baseUrl}/${id}`, data);
  }

  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  toggleUserStatus(id: string, status: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/${id}/status`, { status });
  }
}
