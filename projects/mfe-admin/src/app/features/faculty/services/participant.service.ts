import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PageDTO,
  ApiResponse,
  RegistrationResponse,
  normalizeRegistrationDateFields,
} from '@my-mfe/interface';
import { map } from 'rxjs';

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
    academicYear: string,
    page: number,
    size: number,
  ): Observable<ApiResponse<PageDTO<RegistrationResponse>>> {
    let params = new HttpParams()
      .set('activityId', activityId.toString())
      .set('keyword', keyword)
      .set('status', status)
      .set('page', (page - 1).toString())
      .set('size', size.toString())
      .set('sort', 'registeredAt,desc');

    if (academicYear) {
      params = params.set('academicYear', academicYear);
    }

    return this.http
      .get<ApiResponse<PageDTO<RegistrationResponse>>>(this.apiUrl, { params })
      .pipe(
        map((response) => ({
          ...response,
          data: response.data
            ? {
                ...response.data,
                data: (response.data.data || []).map((registration) =>
                  normalizeRegistrationDateFields(registration),
                ),
              }
            : response.data,
        })),
      );
  }

  getParticipantAcademicYears(activityId: number): Observable<ApiResponse<string[]>> {
    const params = new HttpParams().set('activityId', activityId.toString());
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/academic-years`, { params });
  }

  updateParticipantStatus(
    id: number,
    newStatus: number,
    processViolation = false,
  ): Observable<ApiResponse<RegistrationResponse>> {
    return this.http
      .put<ApiResponse<RegistrationResponse>>(`${this.apiUrl}/${id}/status`, {
        status: newStatus,
        processViolation,
      })
      .pipe(
        map((response) => ({
          ...response,
          data: response.data
            ? normalizeRegistrationDateFields(response.data)
            : response.data,
        })),
      );
  }

  // Gọi API tải file Excel
  exportExcel(activityId: number, keyword: string, status: string, academicYear: string): Observable<Blob> {
    let params = new HttpParams()
      .set('activityId', activityId.toString())
      .set('keyword', keyword)
      .set('status', status);

    if (academicYear) {
      params = params.set('academicYear', academicYear);
    }

    return this.http.get(`${this.apiUrl}/export`, { params, responseType: 'blob' });
  }
}
