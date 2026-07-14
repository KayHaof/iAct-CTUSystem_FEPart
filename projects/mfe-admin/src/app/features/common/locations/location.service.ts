import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiResponse } from '@my-mfe/interface';
import { Observable, map } from 'rxjs';

export interface LocationRequest {
  name: string;
  code?: string | null;
  type: string;
  description?: string | null;
  address?: string | null;
  building?: string | null;
  floor?: string | null;
  room?: string | null;
  capacity?: number | null;
  managerDepartmentId?: number | null;
  managerUserId?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  adminManaged?: boolean | null;
  isBookable?: boolean | null;
  availabilityStatus?: string | null;
  isActive?: boolean | null;
  unavailableReason?: string | null;
  note?: string | null;
}

export interface LocationAvailabilityRequest {
  isBookable?: boolean | null;
  availabilityStatus?: string | null;
  unavailableReason?: string | null;
}

export interface LocationResponse extends LocationRequest {
  id: number;
  adminManaged?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LocationBookingResponse {
  id: number;
  activityId: number;
  locationId: number;
  locationName?: string | null;
  locationCode?: string | null;
  title?: string | null;
  startTime: string;
  endTime: string;
  status: number;
  statusLabel?: string | null;
  requestedBy?: number | null;
  approvedBy?: number | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LocationFilters {
  active?: boolean | null;
  bookable?: boolean | null;
  type?: string | null;
  managerDepartmentId?: number | null;
  availabilityStatus?: string | null;
  keyword?: string | null;
  adminManaged?: boolean | null;
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

  getLocations(filters: LocationFilters = {}): Observable<LocationResponse[]> {
    return this.http
      .get<ApiResponse<LocationResponse[]>>(this.apiUrl, { params: this.toParams(filters) })
      .pipe(map((response) => response.data || []));
  }

  getAvailableLocations(filters: AvailableLocationFilters): Observable<LocationResponse[]> {
    return this.http
      .get<ApiResponse<LocationResponse[]>>(`${this.apiUrl}/available`, {
        params: this.toParams(filters),
      })
      .pipe(map((response) => response.data || []));
  }

  getLocationBookings(
    id: number,
    date?: string | null,
    view = 'month',
    statuses?: number[] | null,
  ): Observable<LocationBookingResponse[]> {
    let params = new HttpParams().set('view', view);
    if (date) params = params.set('date', date);
    if (statuses?.length) {
      for (const status of statuses) params = params.append('statuses', String(status));
    }
    return this.http
      .get<ApiResponse<LocationBookingResponse[]>>(`${this.apiUrl}/${id}/bookings`, { params })
      .pipe(map((response) => response.data || []));
  }

  createLocation(payload: LocationRequest): Observable<LocationResponse> {
    return this.http
      .post<ApiResponse<LocationResponse>>(this.apiUrl, payload)
      .pipe(map((response) => response.data as LocationResponse));
  }

  updateLocation(id: number, payload: LocationRequest): Observable<LocationResponse> {
    return this.http
      .put<ApiResponse<LocationResponse>>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((response) => response.data as LocationResponse));
  }

  updateAvailability(
    id: number,
    payload: LocationAvailabilityRequest,
  ): Observable<LocationResponse> {
    return this.http
      .patch<ApiResponse<LocationResponse>>(`${this.apiUrl}/${id}/availability`, payload)
      .pipe(map((response) => response.data as LocationResponse));
  }

  activateLocation(id: number): Observable<LocationResponse> {
    return this.http
      .patch<ApiResponse<LocationResponse>>(`${this.apiUrl}/${id}/activate`, {})
      .pipe(map((response) => response.data as LocationResponse));
  }

  deactivateLocation(id: number): Observable<LocationResponse> {
    return this.http
      .patch<ApiResponse<LocationResponse>>(`${this.apiUrl}/${id}/deactivate`, {})
      .pipe(map((response) => response.data as LocationResponse));
  }

  private toParams(filters: object): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === '') continue;
      params = params.set(key, String(value));
    }
    return params;
  }
}
