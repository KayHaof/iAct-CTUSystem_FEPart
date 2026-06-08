import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Activity {
  id?: number;
  title: string;
  description?: string;
  content?: string;
  location?: string;
  maxParticipants?: number;
  coverImage?: string;
  thumbnail?: string;
  registrationStart?: string;
  registrationEnd?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: number;
  departmentName?: string;
  semesterId?: number;
  status?: number;
  registeredCount?: number;
  categoryId?: number;
  categoryName?: string;
  benefits?: Benefit[];
  schedules?: ActivitySchedule[];
}

export interface ActivitySchedule {
  id?: number;
  name: string;
  startTime: string;
  endTime: string;
  location?: string;
}

export interface Benefit {
  id?: number;
  type: number;
  categoryId: number;
  categoryName?: string;
  point: number;
}

export interface Registration {
  id?: number;
  activityId: number;
  studentId: number;
  studentName?: string;
  studentCode?: string;
  registeredAt?: string;
  status: number;
  scheduleIds?: number[];
}

export interface PageDTO<T> {
  pageNumber: number;
  totalPage: number;
  totalRows: number;
  data: T[];
}

export interface ApiResponse<T> {
  code: number;
  message?: string;
  data?: T;
  timestamp?: number;
}

export interface PointSummary {
  studentId: number;
  studentCode: string;
  studentName: string;
  semesterId: number;
  semesterName: string;
  totalPoint: number;
  maxPoint: number;
  percentage: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

export interface DepartmentStats {
  departmentId: number;
  departmentName: string;
  totalActivities: number;
  pendingActivities: number;
  approvedActivities: number;
  totalRegistrations: number;
  attendanceRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private baseUrl = 'http://localhost:8080';
  private apiUrl = `${this.baseUrl}/activity/api/v1`;
  private http = inject(HttpClient);

  // ============ ACTIVITIES ============

  getActivities(params: {
    keyword?: string;
    status?: string;
    level?: string;
    departmentId?: number;
    page?: number;
    size?: number;
  }): Observable<ApiResponse<PageDTO<Activity>>> {
    let httpParams = new HttpParams();
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.level) httpParams = httpParams.set('level', params.level);
    if (params.departmentId) httpParams = httpParams.set('departmentId', params.departmentId.toString());
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.size) httpParams = httpParams.set('size', params.size.toString());

    return this.http.get<ApiResponse<PageDTO<Activity>>(`${this.apiUrl}/activities`, { params: httpParams });
  }

  getActivityById(id: number): Observable<ApiResponse<Activity>> {
    return this.http.get<ApiResponse<Activity>>(`${this.apiUrl}/activities/${id}`);
  }

  getActivitiesForRegistration(semesterId?: number, page = 1, size = 12): Observable<ApiResponse<PageDTO<Activity>>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (semesterId) params = params.set('semesterId', semesterId.toString());
    return this.http.get<ApiResponse<PageDTO<Activity>>(`${this.apiUrl}/activities/for-registration`, { params });
  }

  searchActivities(params: {
    keyword?: string;
    departmentId?: number;
    startDate?: string;
    endDate?: string;
    categoryIds?: number[];
    category?: string;
    page?: number;
    size?: number;
  }): Observable<ApiResponse<PageDTO<Activity>>> {
    let httpParams = new HttpParams();
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.departmentId) httpParams = httpParams.set('departmentId', params.departmentId.toString());
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.size) httpParams = httpParams.set('size', params.size.toString());

    return this.http.get<ApiResponse<PageDTO<Activity>>(`${this.apiUrl}/activities/search`, { params: httpParams });
  }

  getRecommendations(limit = 10): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/activities/recommendations`, {
      params: new HttpParams().set('limit', limit.toString())
    });
  }

  createActivity(data: Partial<Activity>): Observable<ApiResponse<Activity>> {
    return this.http.post<ApiResponse<Activity>>(`${this.apiUrl}/activities`, data);
  }

  updateActivity(id: number, data: Partial<Activity>): Observable<ApiResponse<Activity>> {
    return this.http.put<ApiResponse<Activity>>(`${this.apiUrl}/activities/${id}`, data);
  }

  deleteActivity(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/activities/${id}`);
  }

  approveActivity(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/activities/${id}/approve`, {});
  }

  rejectActivity(id: number, reason: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/activities/${id}/reject`, { reason });
  }

  // ============ REGISTRATIONS ============

  register(activityId: number, scheduleIds?: number[]): Observable<ApiResponse<Registration>> {
    return this.http.post<ApiResponse<Registration>>(`${this.apiUrl}/registrations/join`, {
      activityId,
      scheduleIds
    });
  }

  getMyStatus(activityId: number): Observable<ApiResponse<Registration | null>> {
    return this.http.get<ApiResponse<Registration | null>>(`${this.apiUrl}/registrations/my-status/${activityId}`);
  }

  getMyRecords(semesterId?: number): Observable<ApiResponse<Registration[]>> {
    let params = new HttpParams();
    if (semesterId) params = params.set('semesterId', semesterId.toString());
    return this.http.get<ApiResponse<Registration[]>>(`${this.apiUrl}/registrations/my-records`, { params });
  }

  getRegistrationQR(registrationId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/registrations/${registrationId}/qr`);
  }

  cancelRegistration(registrationId: number, reason?: string): Observable<ApiResponse<Registration>> {
    return this.http.delete<ApiResponse<Registration>>(`${this.apiUrl}/registrations/${registrationId}`, {
      body: reason ? { reason } : {}
    });
  }

  updateRegistrationSessions(registrationId: number, sessionIds: number[]): Observable<ApiResponse<Registration>> {
    return this.http.put<ApiResponse<Registration>>(`${this.apiUrl}/registrations/${registrationId}/sessions`, sessionIds);
  }

  // ============ POINTS ============

  getPointSummary(semesterId?: number): Observable<ApiResponse<PointSummary>> {
    let params = new HttpParams();
    if (semesterId) params = params.set('semesterId', semesterId.toString());
    return this.http.get<ApiResponse<PointSummary>>(`${this.apiUrl}/student-points/summary`, { params });
  }

  getPointDetails(semesterId?: number): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (semesterId) params = params.set('semesterId', semesterId.toString());
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/student-points/details`, { params });
  }

  // ============ STATISTICS ============

  getDepartmentStats(departmentId?: number, semesterId?: number): Observable<ApiResponse<DepartmentStats>> {
    let params = new HttpParams();
    if (departmentId) params = params.set('departmentId', departmentId.toString());
    if (semesterId) params = params.set('semesterId', semesterId.toString());
    return this.http.get<ApiResponse<DepartmentStats>>(`${this.apiUrl}/activities/statistics/department`, { params });
  }

  getSystemStats(semesterId?: number): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (semesterId) params = params.set('semesterId', semesterId.toString());
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/activities/statistics/system`, { params });
  }
}
