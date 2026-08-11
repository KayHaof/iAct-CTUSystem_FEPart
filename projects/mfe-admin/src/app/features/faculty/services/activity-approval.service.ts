import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { ApiResponse, PageDTO, normalizeActivityDateFields } from '@my-mfe/interface';
import { IACT_API_ORIGIN } from '@my-mfe/ui';
import { Activity } from '../../../shared/models/activity.model';

export type ActivityApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
export type ActivityApprovalSortBy =
  | 'updatedAt'
  | 'createdAt'
  | 'startDate'
  | 'endDate'
  | 'title'
  | 'status'
  | 'handledAt';
export type ActivityApprovalSortDirection = 'ASC' | 'DESC';

export interface ActivityApprovalQuery {
  keyword?: string;
  status?: ActivityApprovalStatus;
  classId?: number | null;
  page?: number;
  size?: number;
  sortBy?: ActivityApprovalSortBy;
  sortDirection?: ActivityApprovalSortDirection;
}

export interface ActivityApprovalStats {
  pendingReview: number;
  approvedThisTerm: number;
  rejected: number;
}

export interface ActivityRepresentativeLookup {
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
  canCreateActivity?: boolean;
}

export interface ActivityApprovalClassOption {
  classId: number;
  classCode?: string;
  className?: string;
  label: string;
  representativeCount: number;
  activeRepresentativeCount: number;
}

@Injectable({ providedIn: 'root' })
export class ActivityApprovalService {
  private readonly http = inject(HttpClient);
  private readonly apiOrigin = inject(IACT_API_ORIGIN);
  private readonly activityUrl = `${this.apiOrigin}/activity/api/v1/activities`;
  private readonly representativesUrl = `${this.apiOrigin}/user/api/v1/class-representatives`;

  getActivities(query: ActivityApprovalQuery): Observable<PageDTO<Activity>> {
    let params = new HttpParams()
      .set('keyword', query.keyword?.trim() || '')
      .set('status', query.status || 'PENDING')
      .set('page', String(query.page || 1))
      .set('size', String(query.size || 10))
      .set('sortBy', query.sortBy || 'updatedAt')
      .set('sortDirection', query.sortDirection || 'DESC');

    if (query.classId) {
      params = params.set('classId', String(query.classId));
    }

    return this.http
      .get<ApiResponse<PageDTO<Activity>>>(`${this.activityUrl}/department-approvals`, { params })
      .pipe(
        map((response) => {
          const page = this.unwrap(response) as PageDTO<Activity>;
          return {
            ...page,
            data: (page.data || []).map((activity) => normalizeActivityDateFields(activity)),
          };
        }),
      );
  }

  getStats(query: Pick<ActivityApprovalQuery, 'keyword' | 'classId'> = {}): Observable<ActivityApprovalStats> {
    let params = new HttpParams().set('keyword', query.keyword?.trim() || '');
    if (query.classId) {
      params = params.set('classId', String(query.classId));
    }

    return this.http
      .get<ApiResponse<ActivityApprovalStats>>(`${this.activityUrl}/department-approvals/stats`, {
        params,
      })
      .pipe(
        map(
          (response) =>
            this.unwrap(response) || {
              pendingReview: 0,
              approvedThisTerm: 0,
              rejected: 0,
            },
        ),
      );
  }

  getActivityDetails(id: number | string): Observable<Activity> {
    return this.http
      .get<ApiResponse<Activity>>(`${this.activityUrl}/${id}`)
      .pipe(map((response) => normalizeActivityDateFields(this.unwrap(response) as Activity)));
  }

  approveActivity(id: number | string): Observable<void> {
    return this.http
      .put<ApiResponse<string>>(`${this.activityUrl}/${id}/approve`, {})
      .pipe(map(() => undefined));
  }

  rejectActivity(id: number | string, reason: string): Observable<void> {
    return this.http
      .put<ApiResponse<string>>(`${this.activityUrl}/${id}/reject`, { reason })
      .pipe(map(() => undefined));
  }

  getRepresentatives(): Observable<ActivityRepresentativeLookup[]> {
    return this.http
      .get<ApiResponse<ActivityRepresentativeLookup[]>>(this.representativesUrl)
      .pipe(map((response) => this.unwrap(response) || []));
  }

  toClassOptions(representatives: ActivityRepresentativeLookup[]): ActivityApprovalClassOption[] {
    const classMap = new Map<number, ActivityApprovalClassOption>();

    for (const representative of representatives) {
      if (!representative.classId) {
        continue;
      }

      const current = classMap.get(representative.classId);
      if (current) {
        current.representativeCount += 1;
        if (representative.isActive) {
          current.activeRepresentativeCount += 1;
        }
        continue;
      }

      classMap.set(representative.classId, {
        classId: representative.classId,
        classCode: representative.classCode,
        className: representative.className,
        label: this.buildClassLabel(representative),
        representativeCount: 1,
        activeRepresentativeCount: representative.isActive ? 1 : 0,
      });
    }

    return Array.from(classMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, 'vi'),
    );
  }

  buildClassLabel(representative: ActivityRepresentativeLookup): string {
    const code = representative.classCode?.trim();
    const name = representative.className?.trim();
    if (code && name && code !== name) {
      return `${code} - ${name}`;
    }
    return code || name || 'Chưa xác định chi đoàn';
  }

  private unwrap<T>(response: ApiResponse<T>): T | undefined {
    return response.data ?? response.result;
  }
}
