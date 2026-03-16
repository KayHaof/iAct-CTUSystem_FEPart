import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Activity, ActivityRequest } from '../../../shared/models/activity.model';
import { ApiResponse, PageDTO } from 'interface';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/activity/api/v1/activities';

  // --- LẤY DANH SÁCH (Hỗ trợ phân trang & lọc) ---
  getAllActivities(
    keyword = '',
    level = 'ALL',
    status = 'ALL',
    page = 0,
    size = 5,
  ): Observable<PageDTO<Activity>> {
    const params = new HttpParams()
      .set('keyword', keyword)
      .set('level', level)
      .set('status', status)
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'id,desc');

    return this.http
      .get<ApiResponse<PageDTO<Activity>>>(this.apiUrl, { params })
      .pipe(map((response) => response.result));
  }

  // --- CÁC HÀM KHÁC (Đã bọc ApiResponse chuẩn) ---
  getActivityById(id: string | number): Observable<Activity> {
    return this.http
      .get<ApiResponse<Activity>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.result));
  }

  createActivity(payload: ActivityRequest): Observable<Activity> {
    return this.http
      .post<ApiResponse<Activity>>(this.apiUrl, payload)
      .pipe(map((response) => response.result));
  }

  updateActivity(id: string | number, payload: ActivityRequest): Observable<Activity> {
    return this.http
      .put<ApiResponse<Activity>>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((response) => response.result));
  }

  deleteActivity(id: string | number): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        return;
      }),
    );
  }

  getQrCode(id: number | string): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}/${id}/qr-code`);
  }
}
