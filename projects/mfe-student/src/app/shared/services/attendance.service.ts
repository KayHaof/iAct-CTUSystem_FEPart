import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '@my-mfe/interface';
import { IACT_API_ORIGIN } from '@my-mfe/ui';

export interface FaceCheckInRequest {
  activityId: number;
  liveImage: File;
  latitude?: number;
  longitude?: number;
}

export interface CheckInRequest {
  activityId: number;
  latitude?: number;
  longitude?: number;
  method?: number;
  verifyCode?: string;
}

export interface AttendanceResponse {
  id: number;
  registrationId: number;
  checkinTime: string;
  checkoutTime?: string;
  attendanceStatus?: string;
  method?: number;
  message?: string;
}

export interface FaceCheckInResponse {
  verified: boolean;
  decision?: string;
  allowRetry?: boolean;
  attempt?: number;
  maxAttempts?: number;
  remainingAttempts?: number;
  reasonCode?: string;
  message?: string;
  threshold?: number;
  distance?: number;
  similarity?: number;
  faceMatched?: boolean;
  attemptsRemaining?: number;
  attemptCount?: number;
  attendance?: AttendanceResponse;
}

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private http = inject(HttpClient);
  private readonly apiOrigin = inject(IACT_API_ORIGIN);
  private readonly apiUrl = `${this.apiOrigin}/activity/api/v1/attendances`;

  checkIn(request: CheckInRequest): Observable<ApiResponse<AttendanceResponse>> {
    return this.http.post<ApiResponse<AttendanceResponse>>(`${this.apiUrl}/check-in`, request);
  }

  checkOut(request: CheckInRequest): Observable<ApiResponse<AttendanceResponse>> {
    return this.http.post<ApiResponse<AttendanceResponse>>(`${this.apiUrl}/check-out`, request);
  }

  faceCheckIn(request: FaceCheckInRequest): Observable<ApiResponse<FaceCheckInResponse>> {
    const formData = new FormData();
    formData.append('activityId', String(request.activityId));
    formData.append('liveImage', request.liveImage);

    if (request.latitude !== undefined) {
      formData.append('latitude', String(request.latitude));
    }

    if (request.longitude !== undefined) {
      formData.append('longitude', String(request.longitude));
    }

    return this.http.post<ApiResponse<FaceCheckInResponse>>(
      `${this.apiUrl}/face-check-in`,
      formData,
    );
  }
}
