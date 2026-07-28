import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '@my-mfe/interface';
import { IACT_API_ORIGIN } from '@my-mfe/ui';
import {
  ComplaintEligibleActivity,
  ComplaintRequest,
  ComplaintResponse,
} from '../models/complaint.model';

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private http = inject(HttpClient);
  private readonly apiOrigin = inject(IACT_API_ORIGIN);
  private readonly apiUrl = `${this.apiOrigin}/activity/api/v1/complaints`;

  getMyEligibleActivities(
    semesterId?: number | null,
  ): Observable<ApiResponse<ComplaintEligibleActivity[]>> {
    let params = new HttpParams();

    if (semesterId) {
      params = params.set('semesterId', semesterId.toString());
    }

    return this.http.get<ApiResponse<ComplaintEligibleActivity[]>>(
      `${this.apiUrl}/my-eligible-activities`,
      { params },
    );
  }

  submitComplaint(request: ComplaintRequest): Observable<ApiResponse<ComplaintResponse>> {
    return this.http.post<ApiResponse<ComplaintResponse>>(this.apiUrl, request);
  }
}
