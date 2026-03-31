import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Activity, ActivityTimeResponse } from '../models/activity.model';
import { PageDTO, ApiResponse } from 'interface';

export interface Registration {
  id: number;
  status: number; // 0 = Registered, 1 = Attended, 2 = Cancelled
  registeredAt: string;
  cancelReason?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/activity/api/v1/activities';

  getAllActivities(
    keyword = '',
    level = 'ALL',
    status = 'ALL',
    page = 1,
    size = 6,
  ): Observable<PageDTO<Activity>> {
    const params = new HttpParams()
      .set('keyword', keyword)
      .set('level', level)
      .set('status', status)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<ApiResponse<PageDTO<Activity>>>(this.apiUrl, { params })
      .pipe(map((response) => response.result));
  }

  getActivityById(id: number | string): Observable<Activity> {
    return this.http
      .get<ApiResponse<Activity>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.result));
  }

  getActivityTimes(id: number | string): Observable<ActivityTimeResponse> {
    return this.http
      .get<ApiResponse<ActivityTimeResponse>>(`${this.apiUrl}/${id}/times-location`)
      .pipe(map((response) => response.result));
  }

  registerActivity(activityId: number): Observable<ApiResponse<Registration>> {
    return this.http.post<ApiResponse<Registration>>(`${this.apiUrl}/${activityId}/register`, {});
  }

  cancelRegistration(activityId: number): Observable<ApiResponse<Registration>> {
    return this.http.delete<ApiResponse<Registration>>(`${this.apiUrl}/${activityId}/register`);
  }
}
