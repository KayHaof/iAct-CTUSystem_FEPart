import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiResponse } from '@my-mfe/interface';
import { Observable, map } from 'rxjs';

export interface LocationResponse {
  id: number;
  name: string;
  code?: string | null;
  type?: string | null;
  capacity?: number | null;
  building?: string | null;
  floor?: string | null;
  room?: string | null;
}

export interface AvailableLocationFilters {
  startTime: string;
  endTime: string;
  minCapacity?: number | null;
  type?: string | null;
  managerDepartmentId?: number | null;
  keyword?: string | null;
  adminManaged?: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/activity/api/v1/locations';

  getAvailableLocations(filters: AvailableLocationFilters): Observable<LocationResponse[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === '') continue;
      params = params.set(key, String(value));
    }
    return this.http
      .get<ApiResponse<LocationResponse[]>>(`${this.apiUrl}/available`, { params })
      .pipe(map((response) => response.data || []));
  }
}
