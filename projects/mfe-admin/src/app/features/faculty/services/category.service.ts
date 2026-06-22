import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '@my-mfe/interface';
import { CategoryResponse, CategoryRequest } from '../../../shared/models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/activity/api/v1/categories';

  getAllCategoriesFlat(): Observable<ApiResponse<CategoryResponse[]>> {
    return this.http.get<ApiResponse<CategoryResponse[]>>(this.API_URL);
  }

  getAllCategoriesTree(active = true): Observable<ApiResponse<CategoryResponse[]>> {
    const params = new HttpParams().set('active', String(active));
    return this.http.get<ApiResponse<CategoryResponse[]>>(`${this.API_URL}/tree`, { params });
  }

  getCategoryById(id: number): Observable<ApiResponse<CategoryResponse>> {
    return this.http.get<ApiResponse<CategoryResponse>>(`${this.API_URL}/${id}`);
  }

  createCategory(payload: CategoryRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.http.post<ApiResponse<CategoryResponse>>(this.API_URL, payload);
  }

  updateCategory(id: number, payload: CategoryRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.http.put<ApiResponse<CategoryResponse>>(`${this.API_URL}/${id}`, payload);
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }
}
