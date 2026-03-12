import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistrationResponse } from '../models/registration.model';
import { ApiResponse } from 'interface';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private http = inject(HttpClient);
  private apiUrl = 'activities';
  private readonly API_URL = 'http://localhost:8080/activity/api/v1/registrations';

  // 1. Kiểm tra trạng thái đăng ký của tôi
  getMyStatus(activityId: number): Observable<ApiResponse<RegistrationResponse>> {
    return this.http.get<ApiResponse<RegistrationResponse>>(
      `${this.API_URL}/my-status/${activityId}`,
    );
  }

  // 2. Tham gia hoạt động
  registerActivity(activityId: number, scheduleIds: number[] = []): Observable<ApiResponse<RegistrationResponse>> {
    const payload = {
      activityId: activityId,
      scheduleIds: scheduleIds,
    };
    return this.http.post<ApiResponse<RegistrationResponse>>(`${this.API_URL}/join`, payload);
  }

  // 3. Hủy đăng ký hoạt động
  cancelRegistration(
    activityId: number,
    reason: string,
  ): Observable<ApiResponse<RegistrationResponse>> {
    return this.http.patch<ApiResponse<RegistrationResponse>>(
      `${this.API_URL}/cancel-by-activity/${activityId}`,
      { reason: reason },
    );
  }
}
