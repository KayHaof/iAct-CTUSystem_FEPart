import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse, PageDTO, Semester, normalizeApiUtcDateTime } from '@my-mfe/interface';

export type CertificateSubmissionStatus = 0 | 1 | 2 | 3;

export interface CertificateSubmission {
  id: number;
  studentId?: number;
  studentCode?: string;
  studentName?: string;
  departmentId?: number;
  semesterId?: number;
  semesterName?: string;
  imageUrl: string;
  studentNote?: string | null;
  rawText?: string | null;
  extractedJson?: string | null;
  extractedStudentName?: string | null;
  extractedStudentCode?: string | null;
  certificateTitle?: string | null;
  issuer?: string | null;
  issuedDate?: string | null;
  achievement?: string | null;
  suggestedCategoryId?: number | null;
  suggestedCategoryName?: string | null;
  suggestedPoint?: number | null;
  suggestionReason?: string | null;
  aiConfidence?: number | null;
  aiWarnings?: string[];
  needsReview?: boolean | null;
  status: CertificateSubmissionStatus;
  statusLabel?: string;
  reviewerId?: number | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  approvedCategoryId?: number | null;
  approvedCategoryName?: string | null;
  approvedPoint?: number | null;
  reviewNote?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CertificateSubmissionQuery {
  status?: CertificateSubmissionStatus | null;
  semesterId?: number | null;
  keyword?: string | null;
  excludeAutoRejected?: boolean;
  page?: number;
  size?: number;
}

export interface CertificateReviewRequest {
  approvedCategoryId: number;
  approvedPoint: number;
  certificateTitle?: string | null;
  achievement?: string | null;
  reviewNote?: string | null;
}

export interface CertificateRejectRequest {
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class CertificateApprovalService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/activity/api/v1/certificate-submissions';
  private readonly semesterUrl = 'http://localhost:8080/activity/api/v1/semesters';

  getSubmissions(
    query: CertificateSubmissionQuery = {},
  ): Observable<ApiResponse<PageDTO<CertificateSubmission>>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('size', String(query.size ?? 10));

    if (query.status != null) {
      params = params.set('status', String(query.status));
    }
    if (query.semesterId != null) {
      params = params.set('semesterId', String(query.semesterId));
    }
    if (query.keyword?.trim()) {
      params = params.set('keyword', query.keyword.trim());
    }
    if (query.excludeAutoRejected) {
      params = params.set('excludeAutoRejected', 'true');
    }

    return this.http
      .get<ApiResponse<PageDTO<CertificateSubmission>>>(this.apiUrl, { params })
      .pipe(map((response) => this.normalizePageResponse(response)));
  }

  approve(
    id: number,
    request: CertificateReviewRequest,
  ): Observable<ApiResponse<CertificateSubmission>> {
    return this.http
      .put<ApiResponse<CertificateSubmission>>(`${this.apiUrl}/${id}/approve`, request)
      .pipe(map((response) => this.normalizeSubmissionResponse(response)));
  }

  reject(
    id: number,
    request: CertificateRejectRequest,
  ): Observable<ApiResponse<CertificateSubmission>> {
    return this.http
      .put<ApiResponse<CertificateSubmission>>(`${this.apiUrl}/${id}/reject`, request)
      .pipe(map((response) => this.normalizeSubmissionResponse(response)));
  }

  getSemesters(): Observable<ApiResponse<Semester[]>> {
    return this.http.get<ApiResponse<Semester[]>>(this.semesterUrl);
  }

  private normalizePageResponse(
    response: ApiResponse<PageDTO<CertificateSubmission>>,
  ): ApiResponse<PageDTO<CertificateSubmission>> {
    return {
      ...response,
      data: response.data
        ? {
            ...response.data,
            data: (response.data.data || []).map((submission) =>
              this.normalizeSubmission(submission),
            ),
          }
        : response.data,
    };
  }

  private normalizeSubmissionResponse(
    response: ApiResponse<CertificateSubmission>,
  ): ApiResponse<CertificateSubmission> {
    return {
      ...response,
      data: response.data ? this.normalizeSubmission(response.data) : response.data,
    };
  }

  private normalizeSubmission(submission: CertificateSubmission): CertificateSubmission {
    return {
      ...submission,
      reviewedAt: normalizeApiUtcDateTime(submission.reviewedAt),
      createdAt: normalizeApiUtcDateTime(submission.createdAt) || undefined,
      updatedAt: normalizeApiUtcDateTime(submission.updatedAt) || undefined,
    };
  }
}
