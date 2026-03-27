import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PageDTO, Department, Semester } from 'interface';
import {
  ModerationStats,
  ModerationFilters,
} from '../../../shared/models/activity-moderation.model';
import { Activity } from '../../../shared/models/activity.model';

@Injectable({
  providedIn: 'root',
})
export class ActivityModerationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/activity/api/v1/activities';

  getStats(): Observable<ApiResponse<ModerationStats>> {
    return this.http.get<ApiResponse<ModerationStats>>(`${this.apiUrl}/stats`);
  }

  getAllDepartments(): Observable<ApiResponse<PageDTO<Department>>> {
    return this.http.get<ApiResponse<PageDTO<Department>>>(
      `http://localhost:8080/profile/api/v1/departments`,
    );
  }

  getAllSemesters(): Observable<ApiResponse<Semester[]>> {
    return this.http.get<ApiResponse<Semester[]>>(`http://localhost:8080/credit/api/v1/semesters`);
  }

  getFilteredActivities(
    filters: ModerationFilters,
    page: number,
    size: number,
  ): Observable<ApiResponse<PageDTO<Activity>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('status', filters.status);

    if (filters.departmentId) params = params.set('departmentId', filters.departmentId.toString());
    if (filters.semesterId) params = params.set('semesterId', filters.semesterId.toString());

    return this.http.get<ApiResponse<PageDTO<Activity>>>(this.apiUrl, { params });
  }

  approveActivity(activityId: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${activityId}/approve`, {});
  }

  rejectActivity(activityId: string, reason: string): Observable<ApiResponse<void>> {
    const payload = {
      reason: reason,
    };

    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${activityId}/reject`, payload);
  }

  getActivityDetails(activityId: string): Observable<ApiResponse<Activity>> {
    return this.http.get<ApiResponse<Activity>>(`${this.apiUrl}/${activityId}`);
  }
}
