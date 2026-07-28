import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageDTO, ApiResponse } from '@my-mfe/interface';
import { RegistrationResponse } from '@my-mfe/interface';

@Injectable({
  providedIn: 'root',
})
export class ParticipantService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/activity/api/v1/registrations';

  getParticipantsByActivity(
    activityId: number,
    keyword: string,
    status: string,
    page: number,
    size: number,
  ): Observable<ApiResponse<PageDTO<RegistrationResponse>>> {
    const params = new HttpParams()
      .set('activityId', activityId.toString())
      .set('keyword', keyword)
      .set('status', status)
      .set('page', (page - 1).toString())
      .set('size', size.toString())
      .set('sort', 'registeredAt,desc');
    return this.http.get<ApiResponse<PageDTO<RegistrationResponse>>>(this.apiUrl, { params });
  }

  updateParticipantStatus(
    id: number,
    newStatus: number,
  ): Observable<ApiResponse<RegistrationResponse>> {
    return this.http.put<ApiResponse<RegistrationResponse>>(`${this.apiUrl}/${id}/status`, {
      status: newStatus,
    });
  }

  // Gọi API tải file Excel
  exportExcel(activityId: number, keyword: string, status: string): Observable<Blob> {
    const params = new HttpParams()
      .set('activityId', activityId.toString())
      .set('keyword', keyword)
      .set('status', status);
    return this.http.get(`${this.apiUrl}/export`, { params, responseType: 'blob' });
  }
}
