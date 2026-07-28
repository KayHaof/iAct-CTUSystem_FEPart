import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '@my-mfe/interface';
import { IACT_API_ORIGIN } from '@my-mfe/ui';

export interface ProofSubmissionRequest {
  activityId: number;
  imageUrl: string;
  description?: string;
}

export interface ProofResponse {
  id: number;
  activityId: number;
  imageUrl: string;
  description: string;
  status: number;
}

@Injectable({ providedIn: 'root' })
export class ProofService {
  private http = inject(HttpClient);
  private readonly apiOrigin = inject(IACT_API_ORIGIN);
  private readonly apiUrl = `${this.apiOrigin}/activity/api/v1/proofs`;

  submitProof(request: ProofSubmissionRequest): Observable<ApiResponse<ProofResponse>> {
    return this.http.post<ApiResponse<ProofResponse>>(`${this.apiUrl}/submit`, request);
  }
}
