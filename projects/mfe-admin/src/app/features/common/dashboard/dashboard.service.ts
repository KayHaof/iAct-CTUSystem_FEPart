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

interface DashboardStatsPayload {
  totalActivities?: unknown;
  activeActivities?: unknown;
  pendingActivities?: unknown;
  totalStudents?: unknown;
  totalDepartments?: unknown;
  totalMajors?: unknown;
  recentActivities?: RecentActivityPayload[];
}

interface RecentActivityPayload {
  id?: unknown;
  title?: unknown;
  name?: unknown;
  departmentName?: unknown;
  department?: unknown;
  startDate?: unknown;
  start_time?: unknown;
  status?: unknown;
  registeredCount?: unknown;
  registered_count?: unknown;
  maxParticipants?: unknown;
  max_participants?: unknown;
  thumbnail?: unknown;
  coverImage?: unknown;
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
    return this.http.get<ApiResponse<DashboardStatsPayload>>(`${this.apiUrl}/dashboard/stats`).pipe(
      map((response) => {
        const data = response.data || {};
        const recentActivities = Array.isArray(data.recentActivities) ? data.recentActivities : [];

        return {
          totalActivities: this.toNumber(data.totalActivities),
          activeActivities: this.toNumber(data.activeActivities),
          pendingActivities: this.toNumber(data.pendingActivities),
          totalStudents: this.toNumber(data.totalStudents),
          totalDepartments: this.toNumber(data.totalDepartments),
          totalMajors: this.toNumber(data.totalMajors),
          recentActivities: recentActivities.map((item) => this.toRecentActivity(item)),
        };
      }),
    );
  }

  private toRecentActivity(item: RecentActivityPayload): RecentActivity {
    return {
      id: this.toNumber(item.id),
      title: this.toText(item.title) || this.toText(item.name) || 'Hoạt động chưa đặt tên',
      departmentName: this.toText(item.departmentName) || this.toText(item.department),
      startDate: this.toText(item.startDate) || this.toText(item.start_time),
      status: this.toNumber(item.status),
      registeredCount: this.toNumber(item.registeredCount ?? item.registered_count),
      maxParticipants: this.toNumber(item.maxParticipants ?? item.max_participants),
      thumbnail: this.toText(item.thumbnail) || this.toText(item.coverImage),
    };
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toText(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}
