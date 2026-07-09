import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PageDTO } from '@my-mfe/interface';

export interface ProofApproval {
  id: number;
  registrationId: number;
  activityId: number;
  activityTitle: string;
  studentId: number;
  studentCode?: string;
  studentName?: string;
  studentAvatarUrl?: string;
  imageUrl: string;
  description?: string;
  status: number;
  rejectionReason?: string;
  verifiedBy?: number;
  verifiedTime?: string;
  submittedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ProofApprovalService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/activity/api/v1/proofs';

  getProofs(
    status: number | null,
    page: number,
    size: number,
    activityId?: number | null,
  ): Observable<ApiResponse<PageDTO<ProofApproval>>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    if (status !== null) {
      params = params.set('status', status.toString());
    }

    if (activityId) {
      params = params.set('activityId', activityId.toString());
    }

    return this.http.get<ApiResponse<PageDTO<ProofApproval>>>(this.apiUrl, { params });
  }

  approveProof(id: number): Observable<ApiResponse<ProofApproval>> {
    return this.http.put<ApiResponse<ProofApproval>>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectProof(id: number, reason: string): Observable<ApiResponse<ProofApproval>> {
    const params = new HttpParams().set('reason', reason);
    return this.http.put<ApiResponse<ProofApproval>>(`${this.apiUrl}/${id}/reject`, {}, { params });
  }
}
