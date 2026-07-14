import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '@my-mfe/interface';

export interface ClassRepresentative {
  id: number;
  studentId: number;
  studentCode?: string;
  studentName?: string;
  classId: number;
  classCode?: string;
  className?: string;
  departmentId?: number;
  departmentName?: string;
  representativeType?: string;
  isActive?: boolean;
  canCreateActivity?: boolean;
}

export interface ClassRepresentativeRequest {
  classId: number;
  studentId: number;
  representativeType: string;
  startDate?: string | null;
  endDate?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClassRepresentativeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/user/api/v1/class-representatives';

  getRepresentatives(filters: {
    departmentId?: number | string;
    classId?: number | string;
    active?: boolean | string;
    keyword?: string;
  }): Observable<ApiResponse<ClassRepresentative[]>> {
    let params = new HttpParams();
    if (filters.departmentId !== undefined && filters.departmentId !== '') {
      params = params.set('departmentId', filters.departmentId);
    }
    if (filters.classId !== undefined && filters.classId !== '') {
      params = params.set('classId', filters.classId);
    }
    if (filters.active !== undefined && filters.active !== '') {
      params = params.set('active', filters.active);
    }
    if (filters.keyword?.trim()) {
      params = params.set('keyword', filters.keyword.trim());
    }
    return this.http.get<ApiResponse<ClassRepresentative[]>>(this.baseUrl, { params });
  }

  createRepresentative(
    payload: ClassRepresentativeRequest,
  ): Observable<ApiResponse<ClassRepresentative>> {
    return this.http.post<ApiResponse<ClassRepresentative>>(this.baseUrl, payload);
  }

  deactivateRepresentative(id: number): Observable<ApiResponse<ClassRepresentative>> {
    return this.http.patch<ApiResponse<ClassRepresentative>>(
      `${this.baseUrl}/${id}/deactivate`,
      {},
    );
  }
}
