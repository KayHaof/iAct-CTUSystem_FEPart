import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistrationResponse, ApiResponse } from '@my-mfe/interface';
import { IACT_API_ORIGIN } from '@my-mfe/ui';

export interface ActivityRecord {
  id: number;
  activityId: number;
  title: string;
  points: number;
  startDate: string;
  location: string;
  organizer: string;
  status: number; // 0: Đăng ký, 1: Tham gia, 2: Hủy
  proofStatus: number; // 0: Chưa nộp, 1: Chờ duyệt, 2: Đã duyệt, 3: Bị từ chối
  canSubmitProof?: boolean;
  nextAction?: string;
  faceVerificationAttemptCount?: number;
  faceVerificationMaxAttempts?: number;
  faceVerificationRemainingAttempts?: number;
  faceVerificationExhausted?: boolean;
  canSubmitComplaint?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private http = inject(HttpClient);
  private readonly apiOrigin = inject(IACT_API_ORIGIN);
  private readonly apiUrl = `${this.apiOrigin}/activity/api/v1/registrations`;

  // 1. Kiểm tra trạng thái đăng ký của tôi (Detail)
  getMyStatus(activityId: number): Observable<ApiResponse<RegistrationResponse>> {
    return this.http.get<ApiResponse<RegistrationResponse>>(
      `${this.apiUrl}/my-status/${activityId}`,
    );
  }

  // 2. Tham gia hoạt động
  registerActivity(
    activityId: number,
    scheduleIds: number[] = [],
  ): Observable<ApiResponse<RegistrationResponse>> {
    const payload = {
      activityId: activityId,
      scheduleIds: scheduleIds,
    };
    return this.http.post<ApiResponse<RegistrationResponse>>(`${this.apiUrl}/join`, payload);
  }

  // 3. Hủy đăng ký hoạt động
  cancelRegistration(
    activityId: number,
    reason: string,
  ): Observable<ApiResponse<RegistrationResponse>> {
    return this.http.patch<ApiResponse<RegistrationResponse>>(
      `${this.apiUrl}/cancel-by-activity/${activityId}`,
      { reason: reason },
    );
  }

  // 4. LẤY DANH SÁCH HOẠT ĐỘNG ĐÃ ĐĂNG KÝ (MY RECORDS)
  getMyRecords(semesterId?: undefined | number | null): Observable<ApiResponse<ActivityRecord[]>> {
    let params = new HttpParams();

    if (semesterId) {
      params = params.set('semesterId', semesterId.toString());
    }

    return this.http.get<ApiResponse<ActivityRecord[]>>(`${this.apiUrl}/my-records`, { params });
  }
}
