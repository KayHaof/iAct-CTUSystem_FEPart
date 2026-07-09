import { Injectable } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { IMessage } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationItem } from '@my-mfe/interface';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService extends RxStomp {
  private currentBrokerUrl: string | null = null;

  constructor() {
    super();
  }

  /** Khởi tạo kết nối WebSocket, truyền userId trong query string */
  initConnection(userId?: number): void {
    const base = 'ws://localhost:8080/internal/notifications/ws';
    const url = userId ? `${base}?userId=${userId}` : base;

    if (this.currentBrokerUrl === url && this.active) {
      return;
    }

    if (this.active) {
      this.deactivate();
    }

    this.configure({
      brokerURL: url,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
      reconnectDelay: 15000,
    });

    this.currentBrokerUrl = url;
    this.activate();
  }

  /** Subscribe notification cá nhân: /topic/user/{userId} */
  watchUserNotification(userId: number): Observable<NotificationItem> {
    return this.watch(`/topic/user/${userId}`).pipe(
      map((message: IMessage) => this.parseNotification(message)),
    );
  }

  /** Subscribe notification broadcast/public: /topic/notifications */
  watchBroadcastNotification(): Observable<NotificationItem> {
    return this.watch('/topic/notifications').pipe(
      map((message: IMessage) => this.parseNotification(message)),
    );
  }

  private parseNotification(message: IMessage): NotificationItem {
    const data = JSON.parse(message.body);

    return {
      id: data.id,
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type ?? 2,
      activityId: data.activityId,
      isRead: data.isRead ?? false,
      readAt: data.readAt,
      createdAt: data.createdAt,
      sourceEventId: data.sourceEventId,
      sourceTopic: data.sourceTopic,
    };
  }
}
