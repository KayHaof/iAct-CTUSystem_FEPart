import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse, PageDTO, normalizeApiUtcDateTime } from '@my-mfe/interface';
import { IACT_API_ORIGIN } from '@my-mfe/ui';
import {
  CertificateSubmissionComplaint,
  CertificateSubmissionComplaintRequest,
  CertificateSubmissionComplaintStatus,
} from '../models/certificate-submission-complaint.model';

export interface CertificateSubmissionComplaintQuery {
  semesterId?: number | null;
  status?: CertificateSubmissionComplaintStatus | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class CertificateSubmissionComplaintService {
  private http = inject(HttpClient);
  private readonly apiOrigin = inject(IACT_API_ORIGIN);
  private readonly apiUrl = `${this.apiOrigin}/activity/api/v1/certificate-submission-complaints`;

  submit(
    request: CertificateSubmissionComplaintRequest,
  ): Observable<ApiResponse<CertificateSubmissionComplaint>> {
    return this.http.post<ApiResponse<CertificateSubmissionComplaint>>(this.apiUrl, request);
  }

  getMine(
    query: CertificateSubmissionComplaintQuery = {},
  ): Observable<ApiResponse<PageDTO<CertificateSubmissionComplaint>>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('size', String(query.size ?? 100));

    if (query.semesterId != null) {
      params = params.set('semesterId', String(query.semesterId));
    }

    if (query.status != null) {
      params = params.set('status', String(query.status));
    }

    return this.http
      .get<ApiResponse<PageDTO<CertificateSubmissionComplaint>>>(`${this.apiUrl}/me`, { params })
      .pipe(
        map((response) => ({
          ...response,
          data: response.data
            ? {
                ...response.data,
                data: (response.data.data || []).map((complaint) => ({
                  ...complaint,
                  reviewedAt: normalizeApiUtcDateTime(complaint.reviewedAt),
                  createdAt: normalizeApiUtcDateTime(complaint.createdAt) || undefined,
                  updatedAt: normalizeApiUtcDateTime(complaint.updatedAt) || undefined,
                })),
              }
            : response.data,
        })),
      );
  }
}
