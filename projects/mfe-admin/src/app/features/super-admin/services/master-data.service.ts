import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PageDTO } from '@my-mfe/interface';

import {
  CategoryFilters,
  CategoryRequest,
  CategoryResponse,
  ClassFilters,
  ClassRequest,
  ClassResponse,
  DepartmentFilters,
  DepartmentRequest,
  DepartmentResponse,
  MajorFilters,
  MajorRequest,
  MajorResponse,
  SemesterFilters,
  SemesterRequest,
  SemesterResponse,
} from '../../../shared/models/master-data.model';

@Injectable({
  providedIn: 'root',
})
export class MasterDataService {
  private readonly http = inject(HttpClient);
  private readonly semesterUrl = 'http://localhost:8080/activity/api/v1/semesters';
  private readonly categoryUrl = 'http://localhost:8080/activity/api/v1/categories';
  private readonly departmentUrl = 'http://localhost:8080/user/api/v1/departments';
  private readonly majorUrl = 'http://localhost:8080/user/api/v1/majors';
  private readonly classUrl = 'http://localhost:8080/user/api/v1/classes';

  getSemesters(filters?: SemesterFilters): Observable<ApiResponse<SemesterResponse[]>> {
    let params = new HttpParams();

    if (filters?.active) {
      params = params.set('active', filters.active);
    }

    if (filters?.locked) {
      params = params.set('locked', filters.locked);
    }

    if (filters?.academicYear.trim()) {
      params = params.set('academicYear', filters.academicYear.trim());
    }

    return this.http.get<ApiResponse<SemesterResponse[]>>(this.semesterUrl, { params });
  }

  createSemester(payload: SemesterRequest): Observable<ApiResponse<SemesterResponse>> {
    return this.http.post<ApiResponse<SemesterResponse>>(this.semesterUrl, payload);
  }

  updateSemester(id: number, payload: SemesterRequest): Observable<ApiResponse<SemesterResponse>> {
    return this.http.put<ApiResponse<SemesterResponse>>(`${this.semesterUrl}/${id}`, payload);
  }

  activateSemester(id: number): Observable<ApiResponse<SemesterResponse>> {
    return this.http.patch<ApiResponse<SemesterResponse>>(`${this.semesterUrl}/${id}/activate`, {});
  }

  lockSemester(id: number): Observable<ApiResponse<SemesterResponse>> {
    return this.http.patch<ApiResponse<SemesterResponse>>(`${this.semesterUrl}/${id}/lock`, {});
  }

  unlockSemester(id: number): Observable<ApiResponse<SemesterResponse>> {
    return this.http.patch<ApiResponse<SemesterResponse>>(`${this.semesterUrl}/${id}/unlock`, {});
  }

  deleteSemester(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.semesterUrl}/${id}`);
  }

  getCategories(filters?: CategoryFilters): Observable<ApiResponse<CategoryResponse[]>> {
    let params = new HttpParams();

    if (filters?.active) {
      params = params.set('active', filters.active);
    }

    if (filters?.parentId !== '' && filters?.parentId !== undefined) {
      params = params.set('parentId', filters.parentId);
    }

    return this.http.get<ApiResponse<CategoryResponse[]>>(this.categoryUrl, { params });
  }

  getCategoryTree(active: '' | 'true' | 'false' = ''): Observable<ApiResponse<CategoryResponse[]>> {
    let params = new HttpParams();

    if (active) {
      params = params.set('active', active);
    }

    return this.http.get<ApiResponse<CategoryResponse[]>>(`${this.categoryUrl}/tree`, { params });
  }

  createCategory(payload: CategoryRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.http.post<ApiResponse<CategoryResponse>>(this.categoryUrl, payload);
  }

  updateCategory(id: number, payload: CategoryRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.http.put<ApiResponse<CategoryResponse>>(`${this.categoryUrl}/${id}`, payload);
  }

  activateCategory(id: number): Observable<ApiResponse<CategoryResponse>> {
    return this.http.patch<ApiResponse<CategoryResponse>>(`${this.categoryUrl}/${id}/activate`, {});
  }

  deactivateCategory(id: number): Observable<ApiResponse<CategoryResponse>> {
    return this.http.patch<ApiResponse<CategoryResponse>>(
      `${this.categoryUrl}/${id}/deactivate`,
      {},
    );
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.categoryUrl}/${id}`);
  }

  getDepartments(
    page: number,
    size: number,
    filters?: DepartmentFilters,
  ): Observable<ApiResponse<PageDTO<DepartmentResponse>>> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (filters?.keyword.trim()) {
      params = params.set('keyword', filters.keyword.trim());
    }

    if (filters?.active) {
      params = params.set('active', filters.active);
    }

    return this.http.get<ApiResponse<PageDTO<DepartmentResponse>>>(this.departmentUrl, { params });
  }

  getDepartmentOptions(active: '' | 'true' | 'false' = ''): Observable<ApiResponse<DepartmentResponse[]>> {
    let params = new HttpParams();

    if (active) {
      params = params.set('active', active);
    }

    return this.http.get<ApiResponse<DepartmentResponse[]>>(`${this.departmentUrl}/options`, {
      params,
    });
  }

  createDepartment(payload: DepartmentRequest): Observable<ApiResponse<DepartmentResponse>> {
    return this.http.post<ApiResponse<DepartmentResponse>>(this.departmentUrl, payload);
  }

  updateDepartment(id: number, payload: DepartmentRequest): Observable<ApiResponse<DepartmentResponse>> {
    return this.http.put<ApiResponse<DepartmentResponse>>(`${this.departmentUrl}/${id}`, payload);
  }

  activateDepartment(id: number): Observable<ApiResponse<DepartmentResponse>> {
    return this.http.patch<ApiResponse<DepartmentResponse>>(`${this.departmentUrl}/${id}/activate`, {});
  }

  deactivateDepartment(id: number): Observable<ApiResponse<DepartmentResponse>> {
    return this.http.patch<ApiResponse<DepartmentResponse>>(
      `${this.departmentUrl}/${id}/deactivate`,
      {},
    );
  }

  deleteDepartment(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.departmentUrl}/${id}`);
  }

  getMajorList(
    departmentId: '' | number = '',
    active: '' | 'true' | 'false' = '',
  ): Observable<ApiResponse<MajorResponse[]>> {
    let params = new HttpParams();

    if (departmentId !== '') {
      params = params.set('departmentId', departmentId);
    }

    if (active) {
      params = params.set('active', active);
    }

    return this.http.get<ApiResponse<MajorResponse[]>>(this.majorUrl, { params });
  }

  getMajors(
    page: number,
    size: number,
    filters?: MajorFilters,
  ): Observable<ApiResponse<PageDTO<MajorResponse>>> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (filters?.keyword.trim()) {
      params = params.set('keyword', filters.keyword.trim());
    }

    if (filters?.departmentId !== '' && filters?.departmentId !== undefined) {
      params = params.set('departmentId', filters.departmentId);
    }

    if (filters?.active) {
      params = params.set('active', filters.active);
    }

    if (filters?.programType.trim()) {
      params = params.set('programType', filters.programType.trim());
    }

    return this.http.get<ApiResponse<PageDTO<MajorResponse>>>(`${this.majorUrl}/page`, { params });
  }

  createMajor(payload: MajorRequest): Observable<ApiResponse<MajorResponse>> {
    return this.http.post<ApiResponse<MajorResponse>>(this.majorUrl, payload);
  }

  updateMajor(id: number, payload: MajorRequest): Observable<ApiResponse<MajorResponse>> {
    return this.http.put<ApiResponse<MajorResponse>>(`${this.majorUrl}/${id}`, payload);
  }

  activateMajor(id: number): Observable<ApiResponse<MajorResponse>> {
    return this.http.patch<ApiResponse<MajorResponse>>(`${this.majorUrl}/${id}/activate`, {});
  }

  deactivateMajor(id: number): Observable<ApiResponse<MajorResponse>> {
    return this.http.patch<ApiResponse<MajorResponse>>(`${this.majorUrl}/${id}/deactivate`, {});
  }

  deleteMajor(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.majorUrl}/${id}`);
  }

  getClasses(
    page: number,
    size: number,
    filters?: ClassFilters,
  ): Observable<ApiResponse<PageDTO<ClassResponse>>> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (filters?.keyword) {
      params = params.set('keyword', filters.keyword.trim());
    }

    if (filters?.departmentId !== '' && filters?.departmentId !== undefined) {
      params = params.set('departmentId', filters.departmentId);
    }

    if (filters?.majorId !== '' && filters?.majorId !== undefined) {
      params = params.set('majorId', filters.majorId);
    }

    if (filters?.academicYear?.trim()) {
      params = params.set('academicYear', filters.academicYear.trim());
    }

    if (filters?.active) {
      params = params.set('active', filters.active);
    }

    return this.http.get<ApiResponse<PageDTO<ClassResponse>>>(`${this.classUrl}/page`, { params });
  }

  getClassesByMajor(
    majorId: number | string,
    academicYear?: string,
  ): Observable<ApiResponse<ClassResponse[]>> {
    let params = new HttpParams().set('majorId', majorId);

    if (academicYear) {
      params = params.set('academicYear', academicYear);
    }

    return this.http.get<ApiResponse<ClassResponse[]>>(this.classUrl, { params });
  }

  getClassOptions(
    majorId: '' | number = '',
    active: '' | 'true' | 'false' = '',
  ): Observable<ApiResponse<ClassResponse[]>> {
    let params = new HttpParams();

    if (majorId !== '') {
      params = params.set('majorId', majorId);
    }

    if (active === 'true') {
      params = params.set('active', 'true');
    } else if (active === 'false') {
      params = params.set('active', 'false');
    }

    return this.http.get<ApiResponse<ClassResponse[]>>(this.classUrl, { params });
  }

  getClassById(id: number): Observable<ApiResponse<ClassResponse>> {
    return this.http.get<ApiResponse<ClassResponse>>(`${this.classUrl}/${id}`);
  }

  createClass(payload: ClassRequest): Observable<ApiResponse<ClassResponse>> {
    return this.http.post<ApiResponse<ClassResponse>>(this.classUrl, payload);
  }

  updateClass(id: number, payload: ClassRequest): Observable<ApiResponse<ClassResponse>> {
    return this.http.put<ApiResponse<ClassResponse>>(`${this.classUrl}/${id}`, payload);
  }

  activateClass(id: number): Observable<ApiResponse<ClassResponse>> {
    return this.http.patch<ApiResponse<ClassResponse>>(`${this.classUrl}/${id}/activate`, {});
  }

  deactivateClass(id: number): Observable<ApiResponse<ClassResponse>> {
    return this.http.patch<ApiResponse<ClassResponse>>(`${this.classUrl}/${id}/deactivate`, {});
  }

  deleteClass(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.classUrl}/${id}`);
  }
}
