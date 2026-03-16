import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistrationResponse, ApiResponse } from 'interface';

// Khai báo Interface hứng dữ liệu cho màn hình My Records
export interface ActivityRecord {
  id: number;
  activityId: number;
  title: string;
  points: number;
  startDate: string;
  location: string;
  organizer: string;
  status: number; // 0: Đăng ký, 1: Tham gia, 2: Hủy
  proofStatus: number; // 0: Chưa nộp, 1: Chờ duyệt, 2: Đã duyệt
}

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/activity/api/v1/registrations';

  // 1. Kiểm tra trạng thái đăng ký của tôi (Detail)
  getMyStatus(activityId: number): Observable<ApiResponse<RegistrationResponse>> {
    return this.http.get<ApiResponse<RegistrationResponse>>(
      `${this.API_URL}/my-status/${activityId}`,
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

  // 4. LẤY DANH SÁCH HOẠT ĐỘNG ĐÃ ĐĂNG KÝ (MY RECORDS)
  getMyRecords(semesterId?: undefined | number | null): Observable<ApiResponse<ActivityRecord[]>> {
    let params = new HttpParams();

    // Nếu có chọn học kỳ thì mới gửi ID xuống, không thì BE tự lấy tất cả
    if (semesterId) {
      params = params.set('semesterId', semesterId.toString());
    }

    return this.http.get<ApiResponse<ActivityRecord[]>>(`${this.API_URL}/my-records`, { params });
  }
}
