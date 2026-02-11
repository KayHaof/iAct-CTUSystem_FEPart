import { Injectable } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService extends RxStomp {
  constructor() {
    super();
  }

  // Khởi tạo kết nối WebSocket
  initConnection() {
    this.configure({
      brokerURL: 'ws://localhost:8080/internal/notifications/ws',
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
      reconnectDelay: 15000,
      // debug: (msg: string) => console.log(new Date(), msg),
    });

    this.activate();
  }

  watchUser(userId: number): Observable<any> {
    return this.watch(`/topic/user/${userId}`);
  }
}
