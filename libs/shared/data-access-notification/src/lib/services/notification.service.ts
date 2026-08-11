import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  ApiResponse,
  NotificationItem,
  NotificationPage,
  NotificationQuery,
  UrgentNotificationRequest,
  normalizeApiUtcDateTime,
} from '@my-mfe/interface';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private baseUrl = 'http://localhost:8080';
  private apiUrl = `${this.baseUrl}/notification/api/v1`;
  private http = inject(HttpClient);

  /** GET /notifications?page=&size=&isRead= */
  getNotifications(
    query?: NotificationQuery,
  ): Observable<ApiResponse<NotificationPage>> {
    let params = new HttpParams();
    if (query?.page !== undefined) {
      params = params.set('page', query.page.toString());
    }
    if (query?.size !== undefined) {
      params = params.set('size', query.size.toString());
    }
    if (query?.isRead !== undefined) {
      params = params.set('isRead', query.isRead.toString());
    }

    return this.http
      .get<ApiResponse<NotificationPage>>(`${this.apiUrl}/notifications`, { params })
      .pipe(
        map((response) => ({
          ...response,
          data: response.data
            ? {
                ...response.data,
                data: (response.data.data || []).map((item) => this.normalizeNotification(item)),
              }
            : response.data,
          result: response.result
            ? {
                ...response.result,
                data: (response.result.data || []).map((item) => this.normalizeNotification(item)),
              }
            : response.result,
        })),
      );
  }

  /** GET /notifications/count-unread */
  getUnreadCount(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(
      `${this.apiUrl}/notifications/count-unread`,
    );
  }

  /** GET /notifications/{id} */
  getNotificationById(id: number): Observable<ApiResponse<NotificationItem>> {
    return this.http
      .get<ApiResponse<NotificationItem>>(`${this.apiUrl}/notifications/${id}`)
      .pipe(
        map((response) => ({
          ...response,
          data: response.data ? this.normalizeNotification(response.data) : response.data,
          result: response.result ? this.normalizeNotification(response.result) : response.result,
        })),
      );
  }

  /** PUT /notifications/{id}/read */
  markAsRead(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/notifications/${id}/read`,
      {},
    );
  }

  /** PUT /notifications/read-all */
  markAllAsRead(): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/notifications/read-all`,
      {},
    );
  }

  /** DELETE /notifications/{id} */
  deleteNotification(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/notifications/${id}`,
    );
  }

  /** POST /notifications/urgent */
  sendUrgentNotification(
    request: UrgentNotificationRequest,
  ): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(
      `${this.apiUrl}/notifications/urgent`,
      request,
    );
  }

  private normalizeNotification(notification: NotificationItem): NotificationItem {
    return {
      ...notification,
      createdAt: normalizeApiUtcDateTime(notification.createdAt) || notification.createdAt,
      readAt: normalizeApiUtcDateTime(notification.readAt) || undefined,
    };
  }
}
