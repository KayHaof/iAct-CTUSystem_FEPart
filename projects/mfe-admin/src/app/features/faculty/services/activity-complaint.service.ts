import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PageDTO } from '@my-mfe/interface';

export interface ActivityComplaint {
  id: number;
  registrationId: number;
  activityId: number;
  activityTitle?: string;
  semesterId?: number;
  semesterName?: string;
  studentId?: number;
  studentCode?: string;
  studentName?: string;
  detail: string;
  reason?: string;
  evidenceUrl?: string;
  response?: string;
  detailResponse?: string;
  status: number;
  statusLabel?: string;
  resolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResolveActivityComplaintRequest {
  response: string;
}

@Injectable({ providedIn: 'root' })
export class ActivityComplaintService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/activity/api/v1/complaints';

  getByActivity(
    activityId: number,
    status: number | null,
    page: number,
    size: number,
  ): Observable<ApiResponse<PageDTO<ActivityComplaint>>> {
    let params = new HttpParams()
      .set('activityId', activityId.toString())
      .set('page', (page - 1).toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    if (status !== null) {
      params = params.set('status', status.toString());
    }

    return this.http.get<ApiResponse<PageDTO<ActivityComplaint>>>(this.apiUrl, { params });
  }

  approve(id: number, request: ResolveActivityComplaintRequest): Observable<ApiResponse<ActivityComplaint>> {
    return this.http.put<ApiResponse<ActivityComplaint>>(`${this.apiUrl}/${id}/approve`, request);
  }

  reject(id: number, request: ResolveActivityComplaintRequest): Observable<ApiResponse<ActivityComplaint>> {
    return this.http.put<ApiResponse<ActivityComplaint>>(`${this.apiUrl}/${id}/reject`, request);
  }
}
