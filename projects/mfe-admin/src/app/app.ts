import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcome } from './nx-welcome';
import { UserService } from '@my-mfe/auth';
@Component({
  imports: [NxWelcome, RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'mfe-admin';

  // 1. Ní đã inject ở đây rồi, biến này tên là "this.userService"
  private userService = inject(UserService);

  // 2. Sửa constructor: Bỏ tham số bên trong đi
  constructor() {
    console.log('🚀 [MFE Admin] Component đã load!');

    // 3. Muốn log ra xem thì dùng "this.userService"
    console.log('Instance ID:', this.userService);
  }
}
