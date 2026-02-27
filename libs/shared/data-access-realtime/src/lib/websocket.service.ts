import { Injectable } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { IMessage } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: number;
  activityId?: number;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService extends RxStomp {
  constructor() {
    super();
  }

  initConnection(): void {
    this.configure({
      brokerURL: 'ws://localhost:8080/internal/notifications/ws',
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
      reconnectDelay: 15000,
    });

    this.activate();
  }

  watchUserNotification(userId: number): Observable<AppNotification> {
    return this.watch(`/topic/user/${userId}`).pipe(
      map((message: IMessage) => {
        const data = JSON.parse(message.body);

        // Trả về object với type AppNotification
        return {
          id: data.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          activityId: data.activityId,
          isRead: data.isRead,
          createdAt: data.createdAt,
        } as AppNotification;
      }),
    );
  }
}
