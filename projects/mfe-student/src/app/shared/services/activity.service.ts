import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Activity, ActivityTimeResponse } from '../models/activity.model';
import {
  ApiResponse,
  PageDTO,
  normalizeActivityDateFields,
  normalizeApiUtcDateTime,
} from '@my-mfe/interface';
import { IACT_API_ORIGIN } from '@my-mfe/ui';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private http = inject(HttpClient);
  private readonly apiOrigin = inject(IACT_API_ORIGIN);
  private readonly apiUrl = `${this.apiOrigin}/activity/api/v1/activities`;

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
      .pipe(
        map((response) => this.normalizePage(response.data as PageDTO<Activity>)),
      );
  }

  getActivityById(id: number | string): Observable<Activity> {
    return this.http
      .get<ApiResponse<Activity>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => normalizeActivityDateFields(response.data as Activity)));
  }

  getActivityTimes(id: number | string): Observable<ActivityTimeResponse> {
    return this.http
      .get<ApiResponse<ActivityTimeResponse>>(`${this.apiUrl}/${id}/times-location`)
      .pipe(
        map((response) => {
          const data = response.data as ActivityTimeResponse;
          return {
            ...data,
            registrationStart: normalizeApiUtcDateTime(data.registrationStart) || '',
            registrationEnd: normalizeApiUtcDateTime(data.registrationEnd) || '',
            startDate: normalizeApiUtcDateTime(data.startDate) || '',
            endDate: normalizeApiUtcDateTime(data.endDate) || '',
          };
        }),
      );
  }

  private normalizePage(page: PageDTO<Activity>): PageDTO<Activity> {
    return {
      ...page,
      data: (page.data || []).map((activity) => normalizeActivityDateFields(activity)),
    };
  }
}
