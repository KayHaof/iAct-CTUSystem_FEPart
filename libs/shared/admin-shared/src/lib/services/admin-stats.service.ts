import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminStats {
  totalUsers: number;
  totalActivities: number;
  pendingApprovals: number;
  activeSemester: string;
}

@Injectable({ providedIn: 'root' })
export class AdminStatsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/admin/stats';

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(this.apiUrl);
  }
}
