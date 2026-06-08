import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, UserInfo, Department, ClassInfo, MajorInfo, PageDTO } from 'interface';

export interface CreateUserDto extends Partial<UserInfo> {
  password?: string;
  firstName?: string;
  lastName?: string;
  description?: string;
}

export interface UserCounts {
  student: number;
  faculty: number;
  admin: number;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:8080/user/api/v1/users';
  private profileUrl = 'http://localhost:8080/user/api/v1';
  private authUrl = 'http://localhost:8080/user/auth';

  getAllDepartments(): Observable<ApiResponse<Department[]>> {
    return this.http.get<ApiResponse<Department[]>>(`${this.profileUrl}/departments`);
  }

  // Fetch all users by specification
  getUsers(
    page: number,
    size: number,
    keyword?: string,
    roleType?: number,
    departmentId?: number | string,
    status?: number | string,
    classId?: number | string,
  ): Observable<ApiResponse<PageDTO<UserInfo>>> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (keyword) params = params.set('keyword', keyword);
    if (roleType) params = params.set('roleType', roleType);

    if (departmentId !== undefined && departmentId !== null && departmentId !== '') {
      params = params.set('departmentId', departmentId);
    }
    if (status !== undefined && status !== null && status !== '') {
      params = params.set('status', status);
    }

    if (classId !== undefined && classId !== null && classId !== '') {
      params = params.set('classId', classId);
    }

    return this.http.get<ApiResponse<PageDTO<UserInfo>>>(this.baseUrl, { params });
  }

  getMajorsByDepartment(departmentId: number | string): Observable<ApiResponse<MajorInfo[]>> {
    const params = new HttpParams().set('departmentId', departmentId);
    return this.http.get<ApiResponse<MajorInfo[]>>(`http://localhost:8080/user/api/v1/majors`, {
      params,
    });
  }

  getClassesByMajor(
    majorId: number | string,
    academicYear?: string,
  ): Observable<ApiResponse<ClassInfo[]>> {
    let params = new HttpParams().set('majorId', majorId);

    if (academicYear) {
      params = params.set('academicYear', academicYear);
    }

    return this.http.get<ApiResponse<ClassInfo[]>>(`http://localhost:8080/user/api/v1/classes`, {
      params,
    });
  }

  /** Safe helper: extract array from response that may be PageDTO, flat array, or null */
  static extractArray<T>(result: unknown): T[] {
    if (Array.isArray(result)) return result as T[];
    if (!result) return [];
    if (Array.isArray((result as Record<string, unknown>)['data'])) {
      return ((result as Record<string, unknown>)['data'] as T[]) || [];
    }
    return [];
  }

  toggleUserStatus(id: string | number, status: number): Observable<ApiResponse<string>> {
    if (status === 1) {
      return this.http.put<ApiResponse<string>>(`${this.baseUrl}/${id}/active`, {});
    } else {
      return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/${id}`);
    }
  }

  getUserCounts(keyword?: string): Observable<ApiResponse<UserCounts>> {
    let params = new HttpParams();
    if (keyword) params = params.set('keyword', keyword);
    return this.http.get<ApiResponse<UserCounts>>(`${this.baseUrl}/counts`, { params });
  }

  updateProfile(id: number | string, data: Partial<UserInfo>): Observable<ApiResponse<UserInfo>> {
    return this.http.put<ApiResponse<UserInfo>>(`${this.baseUrl}/${id}`, data);
  }

  resetPassword(id: number | string): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.baseUrl}/${id}/reset-password`, {});
  }

  registerUser(payload: CreateUserDto) {
    return this.http.post(`${this.authUrl}/register`, payload, { responseType: 'text' });
  }

  importUsersFromExcel(formData: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/import`, formData);
  }
}
