import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { UserService } from '@my-mfe/auth';
import { WebSocketService } from '@my-mfe/data-access-realtime';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private userService = inject(UserService);
  private webSocketService = inject(WebSocketService);

  constructor() {
    effect(() => {
      const userInfo = this.userService.currentUser();
      if (userInfo) {
        console.log('User Info loaded (Signal):', userInfo.id);
        this.webSocketService.initConnection();
        this.webSocketService.watchUser(userInfo.id).subscribe((message) => {
          try {
            const data = JSON.parse(message.body);
            if (data.type === 99) this.handleForceLogout(data.message);
          } catch (e) {
            console.error('Lỗi xử lý message WebSocket:', e);
          }
        });
      }
    });
  }

  ngOnInit() {
    setTimeout(() => {
      const currentUrl = this.router.url;
      if (currentUrl.includes('code=') || currentUrl.includes('iss=')) {
        this.router
          .navigate([], {
            queryParams: { code: null, state: null, session_state: null, iss: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          })
      }
    }, 100);
  }

  private handleForceLogout(reason: string) {
    Swal.fire({
      icon: 'error',
      title: 'Thông báo',
      text: reason || 'Bị khóa.',
    }); // Ní tự thêm logic logout vào đây nhé
  }
}
