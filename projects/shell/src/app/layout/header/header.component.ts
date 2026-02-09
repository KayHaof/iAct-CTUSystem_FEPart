import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { UserService } from 'shared-ui';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private layoutService = inject(LayoutService);

  private router = inject(Router);

  defaultAvatar =
    'https://res.cloudinary.com/dhjamvg6j/image/upload/v1770104643/b8erttd8eughls55igvb.jpg';

  username: string = '';
  userAvatar: string = this.defaultAvatar;

  ngOnInit() {
    this.fetchUserInfo();
  }

  toggleMenu() {
    this.layoutService.toggleMobileMenu();
  }

  fetchUserInfo() {
    this.userService.getMyInfo().subscribe({
      next: (response: any) => {
        const data = response?.result;

        console.log('User Info:', data);

        if (data) {
          this.username = data.fullName || data.username || 'Student';

          if (data.avtUrl) {
            this.userAvatar = data.avtUrl;
          }
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Lỗi lấy User Info:', err);
      },
    });
  }

  navigateToProfile() {
    this.layoutService.closeMobileMenu();

    this.router.navigate(['/profile']);
  }
}
