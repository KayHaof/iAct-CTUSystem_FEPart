import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: number;
  activityId?: number;
  isRead: boolean;
  createdAt: string;
}

export interface PageDTO<T> {
  pageNumber: number;
  totalPage: number;
  totalRows: number;
  data: T[];
}

export interface ApiResponse<T> {
  code: number;
  message?: string;
  data?: T;
  timestamp?: number;
}

export interface UrgentNotificationRequest {
  title: string;
  message: string;
  priority?: number;
  targetType: 'ALL_DEPARTMENT' | 'ACTIVITY' | 'CLASS';
  targetId?: number;
  activityId?: number;
  userIds?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = 'http://localhost:8080';
  private apiUrl = `${this.baseUrl}/notification/api/v1`;
  private http = inject(HttpClient);

  getNotifications(params?: {
    page?: number;
    size?: number;
    isRead?: boolean;
  }): Observable<ApiResponse<PageDTO<Notification>>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());
    if (params?.isRead !== undefined) {
      httpParams = httpParams.set('isRead', params.isRead.toString());
    }

    return this.http.get<ApiResponse<PageDTO<Notification>>>(
      `${this.apiUrl}/notifications`,
      { params: httpParams }
    );
  }

  getUnreadCount(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(
      `${this.apiUrl}/notifications/count-unread`
    );
  }

  markAsRead(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/notifications/${id}/read`,
      {}
    );
  }

  markAllAsRead(): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/notifications/read-all`,
      {}
    );
  }

  getNotificationById(id: number): Observable<ApiResponse<Notification>> {
    return this.http.get<ApiResponse<Notification>>(
      `${this.apiUrl}/notifications/${id}`
    );
  }

  sendUrgentNotification(request: UrgentNotificationRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(
      `${this.apiUrl}/notifications/urgent`,
      request
    );
  }
}
