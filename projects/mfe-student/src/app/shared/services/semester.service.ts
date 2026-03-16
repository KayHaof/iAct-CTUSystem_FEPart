import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse} from 'interface';

export interface Semester {
  id: number;
  semesterName: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isLocked: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SemesterService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/credit/api/v1/semesters';

  getAllSemesters(): Observable<ApiResponse<Semester[]>> {
    return this.http.get<ApiResponse<Semester[]>>(this.apiUrl);
  }

  getActiveSemester(): Observable<ApiResponse<Semester>> {
    return this.http.get<ApiResponse<Semester>>(`${this.apiUrl}/active`);
  }
}
