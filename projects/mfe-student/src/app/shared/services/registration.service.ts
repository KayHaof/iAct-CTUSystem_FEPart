import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  RegistrationResponse,
  ApiResponse,
  normalizeActivityDateFields,
  normalizeApiUtcDateTime,
  normalizeRegistrationDateFields,
} from '@my-mfe/interface';
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
  scheduleIds?: number[];
  attendanceSessions?: AttendanceSessionRecord[];
  registeredSessionCount?: number;
  faceVerifiedSessionCount?: number;
  absentSessionCount?: number;
}

export interface AttendanceSessionRecord {
  id?: number;
  registrationId: number;
  scheduleId?: number;
  scheduleTitle?: string;
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  checkinTime?: string;
  checkoutTime?: string;
  attendanceStatus?: string;
  status?: number;
  method?: number;
  message?: string;
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
    return this.http
      .get<ApiResponse<RegistrationResponse>>(`${this.apiUrl}/my-status/${activityId}`)
      .pipe(map((response) => this.normalizeRegistrationResponse(response)));
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
    return this.http
      .post<ApiResponse<RegistrationResponse>>(`${this.apiUrl}/join`, payload)
      .pipe(map((response) => this.normalizeRegistrationResponse(response)));
  }

  // 3. Hủy đăng ký hoạt động
  cancelRegistration(
    activityId: number,
    reason: string,
  ): Observable<ApiResponse<RegistrationResponse>> {
    return this.http
      .patch<ApiResponse<RegistrationResponse>>(
        `${this.apiUrl}/cancel-by-activity/${activityId}`,
        { reason: reason },
      )
      .pipe(map((response) => this.normalizeRegistrationResponse(response)));
  }

  // 4. LẤY DANH SÁCH HOẠT ĐỘNG ĐÃ ĐĂNG KÝ (MY RECORDS)
  getMyRecords(semesterId?: undefined | number | null): Observable<ApiResponse<ActivityRecord[]>> {
    let params = new HttpParams();

    if (semesterId) {
      params = params.set('semesterId', semesterId.toString());
    }

    return this.http
      .get<ApiResponse<ActivityRecord[]>>(`${this.apiUrl}/my-records`, { params })
      .pipe(
        map((response) => ({
          ...response,
          data: (response.data || []).map((record) => this.normalizeActivityRecord(record)),
        })),
      );
  }

  private normalizeRegistrationResponse(
    response: ApiResponse<RegistrationResponse>,
  ): ApiResponse<RegistrationResponse> {
    return {
      ...response,
      data: response.data ? normalizeRegistrationDateFields(response.data) : response.data,
    };
  }

  private normalizeActivityRecord(record: ActivityRecord): ActivityRecord {
    const normalized = normalizeRegistrationDateFields(
      normalizeActivityDateFields(record),
    ) as ActivityRecord;

    return {
      ...normalized,
      attendanceSessions: (normalized.attendanceSessions || []).map((session) => ({
        ...session,
        scheduleStartTime:
          normalizeApiUtcDateTime(session.scheduleStartTime) || session.scheduleStartTime,
        scheduleEndTime:
          normalizeApiUtcDateTime(session.scheduleEndTime) || session.scheduleEndTime,
        checkinTime: normalizeApiUtcDateTime(session.checkinTime) || session.checkinTime,
        checkoutTime: normalizeApiUtcDateTime(session.checkoutTime) || session.checkoutTime,
      })),
    };
  }
}
