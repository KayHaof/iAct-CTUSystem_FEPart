import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Activity, ActivityRequest } from '../../../shared/models/activity.model';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/activity/api/v1/activities';

  // Thêm mới hoạt động (POST)
  createActivity(payload: ActivityRequest): Observable<Activity> {
    return this.http.post<Activity>(this.apiUrl, payload);
  }

  // Lấy danh sách tất cả hoạt động (GET)
  getAllActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(this.apiUrl);
  }

  // Lấy chi tiết 1 hoạt động theo ID (GET)
  getActivityById(id: string | number): Observable<Activity> {
    return this.http.get<Activity>(`${this.apiUrl}/${id}`);
  }

  // Cập nhật hoạt động đã có (PUT)
  updateActivity(id: string | number, payload: ActivityRequest): Observable<Activity> {
    return this.http.put<Activity>(`${this.apiUrl}/${id}`, payload);
  }

  deleteActivity(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
