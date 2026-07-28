import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Semester } from '@my-mfe/interface';
import { IACT_API_ORIGIN } from '@my-mfe/ui';

@Injectable({ providedIn: 'root' })
export class SemesterService {
  private http = inject(HttpClient);
  private readonly apiOrigin = inject(IACT_API_ORIGIN);
  private readonly apiUrl = `${this.apiOrigin}/activity/api/v1/semesters`;

  getAllSemesters(): Observable<ApiResponse<Semester[]>> {
    return this.http.get<ApiResponse<Semester[]>>(this.apiUrl);
  }

  getActiveSemester(): Observable<ApiResponse<Semester>> {
    return this.http.get<ApiResponse<Semester>>(`${this.apiUrl}/active`);
  }
}
