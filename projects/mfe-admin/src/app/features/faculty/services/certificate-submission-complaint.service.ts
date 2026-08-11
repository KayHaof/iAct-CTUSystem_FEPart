import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse, PageDTO, normalizeApiUtcDateTime } from '@my-mfe/interface';

export type CertificateSubmissionComplaintStatus = 0 | 1 | 2;

export interface CertificateSubmissionComplaint {
  id: number;
  submissionId?: number;
  studentId?: number;
  studentCode?: string;
  studentName?: string;
  departmentId?: number;
  semesterId?: number;
  semesterName?: string;
  imageUrl?: string;
  certificateTitle?: string | null;
  complaintReason?: string | null;
  status: CertificateSubmissionComplaintStatus;
  statusLabel?: string;
  reviewerId?: number | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CertificateSubmissionComplaintQuery {
  status?: CertificateSubmissionComplaintStatus | null;
  departmentId?: number | null;
  semesterId?: number | null;
  keyword?: string | null;
  page?: number;
  size?: number;
}

export interface CertificateSubmissionComplaintApproveRequest {
  approvedCategoryId: number;
  approvedPoint: number;
  reviewNote?: string | null;
}

export interface CertificateSubmissionComplaintRejectRequest {
  rejectionReason: string;
}

@Injectable({ providedIn: 'root' })
export class CertificateSubmissionComplaintService {
  private http = inject(HttpClient);
  private readonly apiUrl =
    'http://localhost:8080/activity/api/v1/certificate-submission-complaints';

  getComplaints(
    query: CertificateSubmissionComplaintQuery = {},
  ): Observable<ApiResponse<PageDTO<CertificateSubmissionComplaint>>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('size', String(query.size ?? 10));

    if (query.status != null) {
      params = params.set('status', String(query.status));
    }
    if (query.departmentId != null) {
      params = params.set('departmentId', String(query.departmentId));
    }
    if (query.semesterId != null) {
      params = params.set('semesterId', String(query.semesterId));
    }
    if (query.keyword?.trim()) {
      params = params.set('keyword', query.keyword.trim());
    }

    return this.http
      .get<ApiResponse<PageDTO<CertificateSubmissionComplaint>>>(this.apiUrl, { params })
      .pipe(map((response) => this.normalizePageResponse(response)));
  }

  approve(
    id: number,
    request: CertificateSubmissionComplaintApproveRequest,
  ): Observable<ApiResponse<CertificateSubmissionComplaint>> {
    return this.http
      .put<ApiResponse<CertificateSubmissionComplaint>>(`${this.apiUrl}/${id}/approve`, request)
      .pipe(map((response) => this.normalizeComplaintResponse(response)));
  }

  reject(
    id: number,
    request: CertificateSubmissionComplaintRejectRequest,
  ): Observable<ApiResponse<CertificateSubmissionComplaint>> {
    return this.http
      .put<ApiResponse<CertificateSubmissionComplaint>>(`${this.apiUrl}/${id}/reject`, request)
      .pipe(map((response) => this.normalizeComplaintResponse(response)));

  }

  private normalizePageResponse(
    response: ApiResponse<PageDTO<CertificateSubmissionComplaint>>,
  ): ApiResponse<PageDTO<CertificateSubmissionComplaint>> {
    return {
      ...response,
      data: response.data
        ? {
            ...response.data,
            data: (response.data.data || []).map((complaint) =>
              this.normalizeComplaint(complaint),
            ),
          }
        : response.data,
    };
  }

  private normalizeComplaintResponse(
    response: ApiResponse<CertificateSubmissionComplaint>,
  ): ApiResponse<CertificateSubmissionComplaint> {
    return {
      ...response,
      data: response.data ? this.normalizeComplaint(response.data) : response.data,
    };
  }

  private normalizeComplaint(
    complaint: CertificateSubmissionComplaint,
  ): CertificateSubmissionComplaint {
    return {
      ...complaint,
      reviewedAt: normalizeApiUtcDateTime(complaint.reviewedAt),
      createdAt: normalizeApiUtcDateTime(complaint.createdAt) || undefined,
      updatedAt: normalizeApiUtcDateTime(complaint.updatedAt) || undefined,
    };
  }
}
