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
  private userService = inject(UserService);

  constructor() {
    console.log('[MFE Admin] Component đã load!');
    console.log('Instance ID:', this.userService);
  }
}
