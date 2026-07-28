import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, PageDTO } from '@my-mfe/interface';
import { IACT_API_ORIGIN } from '@my-mfe/ui';
import {
  CertificateSubmission,
  CertificateSubmissionRequest,
  CertificateSubmissionStatus,
} from '../models/certificate-submission.model';

export interface CertificateSubmissionQuery {
  semesterId?: number | null;
  status?: CertificateSubmissionStatus | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class CertificateSubmissionService {
  private http = inject(HttpClient);
  private readonly apiOrigin = inject(IACT_API_ORIGIN);
  private readonly apiUrl = `${this.apiOrigin}/activity/api/v1/certificate-submissions`;

  submit(request: CertificateSubmissionRequest): Observable<ApiResponse<CertificateSubmission>> {
    return this.http.post<ApiResponse<CertificateSubmission>>(this.apiUrl, request);
  }

  getMine(
    query: CertificateSubmissionQuery = {},
  ): Observable<ApiResponse<PageDTO<CertificateSubmission>>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('size', String(query.size ?? 20));

    if (query.semesterId != null) {
      params = params.set('semesterId', String(query.semesterId));
    }

    if (query.status != null) {
      params = params.set('status', String(query.status));
    }

    return this.http.get<ApiResponse<PageDTO<CertificateSubmission>>>(`${this.apiUrl}/me`, {
      params,
    });
  }
}
