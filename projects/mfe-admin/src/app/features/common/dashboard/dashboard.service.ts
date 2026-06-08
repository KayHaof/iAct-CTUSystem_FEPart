import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface DashboardStats {
  totalActivities: number;
  activeActivities: number;
  pendingActivities: number;
  totalStudents: number;
  totalDepartments: number;
  totalMajors: number;
  recentActivities: RecentActivity[];
}

export interface RecentActivity {
  id: number;
  title: string;
  departmentName: string;
  startDate: string;
  status: number;
  registeredCount: number;
  maxParticipants: number;
  thumbnail?: string;
}

export interface ApiResponse<T> {
  code: number;
  message?: string;
  data?: T;
  timestamp?: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:8080';
  private apiUrl = `${this.baseUrl}/activity/api/v1`;

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/dashboard/stats`).pipe(
      map((response) => {
        const data = response.data || {};
        return {
          totalActivities: data.totalActivities || 0,
          activeActivities: data.activeActivities || 0,
          pendingActivities: data.pendingActivities || 0,
          totalStudents: data.totalStudents || 0,
          totalDepartments: data.totalDepartments || 0,
          totalMajors: data.totalMajors || 0,
          recentActivities: (data.recentActivities || []).map((item: any) => ({
            id: item.id,
            title: item.title || item.name,
            departmentName: item.departmentName || item.department || '',
            startDate: item.startDate || item.start_time || '',
            status: item.status || 0,
            registeredCount: item.registeredCount || item.registered_count || 0,
            maxParticipants: item.maxParticipants || item.max_participants || 0,
            thumbnail: item.thumbnail || item.coverImage || '',
          })),
        };
      }),
    );
  }
}
