import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from 'interface';

export interface CheckInRequest {
  activityId: number;
  latitude?: number;
  longitude?: number;
  method: number; // 1: QR, 2: Nhập tay, 3: FaceID
  verifyCode?: string;
}

export interface AttendanceResponse {
  id: number;
  registrationId: number;
  checkinTime: string;
  method: number;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/activity/api/v1/attendances';

  checkIn(request: CheckInRequest): Observable<ApiResponse<AttendanceResponse>> {
    return this.http.post<ApiResponse<AttendanceResponse>>(`${this.apiUrl}/check-in`, request);
  }
}
