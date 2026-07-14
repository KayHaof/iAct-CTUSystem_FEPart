import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PageDTO } from '@my-mfe/interface';
import { Activity } from '../models/activity.model';

export interface RepresentativeActivityPermission {
  id?: number;
  studentId?: number;
  studentCode?: string;
  studentName?: string;
  classId?: number;
  classCode?: string;
  className?: string;
  departmentId?: number;
  departmentName?: string;
  representativeType?: string;
  isActive?: boolean;
  canCreateActivity: boolean;
}

export interface ActivityProposalPayload {
  title: string;
  description?: string | null;
  content?: string | null;
  coverImage?: string | null;
  thumbnail?: string | null;
  location?: string | null;
  maxParticipants?: number | null;
  sourceLink?: string | null;
  isExternal: boolean;
  isFaculty: boolean;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: number;
  benefits: Array<{
    categoryId?: number;
    point?: number;
    type?: number;
  }>;
  schedules: Array<{
    title: string;
    startTime: string;
    endTime: string;
    location?: string | null;
    locationId?: number | null;
  }>;
  locationBookings?: Array<{
    title: string;
    locationId: number;
    scheduleId?: number | null;
    startTime: string;
    endTime: string;
  }>;
}

export interface TrainingCategory {
  id: number;
  parentId: number | null;
  code: string;
  name: string;
  maxPoint: number;
  isActive?: boolean;
  children?: TrainingCategory[];
}

@Injectable({ providedIn: 'root' })
export class ActivityProposalService {
  private readonly http = inject(HttpClient);
  private readonly userUrl = 'http://localhost:8080/user/api/v1/class-representatives';
  private readonly activityUrl = 'http://localhost:8080/activity/api/v1/activities';
  private readonly categoryUrl = 'http://localhost:8080/activity/api/v1/categories';

  getMyPermission(): Observable<RepresentativeActivityPermission> {
    return this.http
      .get<ApiResponse<RepresentativeActivityPermission>>(`${this.userUrl}/me/activity-permission`)
      .pipe(map((response) => response.data as RepresentativeActivityPermission));
  }

  createProposal(payload: ActivityProposalPayload): Observable<unknown> {
    return this.http
      .post<ApiResponse<unknown>>(this.activityUrl, payload)
      .pipe(map((response) => response.data));
  }

  updateProposal(id: number, payload: ActivityProposalPayload): Observable<Activity> {
    return this.http
      .put<ApiResponse<Activity>>(`${this.activityUrl}/${id}`, payload)
      .pipe(map((response) => response.data as Activity));
  }

  getMyProposal(id: number): Observable<Activity> {
    return this.http
      .get<ApiResponse<Activity>>(`${this.activityUrl}/my-created/${id}`)
      .pipe(map((response) => response.data as Activity));
  }

  getTrainingCategories(active = true): Observable<TrainingCategory[]> {
    return this.http
      .get<ApiResponse<TrainingCategory[]>>(`${this.categoryUrl}/tree`, {
        params: { active },
      })
      .pipe(map((response) => response.data || []));
  }

  getMyProposals(page = 1, size = 10): Observable<PageDTO<Activity>> {
    return this.http
      .get<ApiResponse<PageDTO<Activity>>>(`${this.activityUrl}/my-created`, {
        params: {
          page,
          size,
        },
      })
      .pipe(map((response) => response.data as PageDTO<Activity>));
  }
}
