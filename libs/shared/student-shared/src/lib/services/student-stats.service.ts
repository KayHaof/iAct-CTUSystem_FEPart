import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StudentStats {
  totalActivities: number;
  totalPoints: number;
  currentSemester: string;
  completionRate: number;
}

@Injectable({ providedIn: 'root' })
export class StudentStatsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/student/stats';

  getStats(): Observable<StudentStats> {
    return this.http.get<StudentStats>(this.apiUrl);
  }
}
