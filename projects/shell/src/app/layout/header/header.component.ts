import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserService } from 'shared-ui';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);


  defaultAvatar =
    'https://res.cloudinary.com/dhjamvg6j/image/upload/v1770104643/b8erttd8eughls55igvb.jpg';

  username: string = '';
  userAvatar: string = this.defaultAvatar;

  ngOnInit() {
    this.fetchUserInfo();
  }

  fetchUserInfo() {
    this.userService.getMyInfo().subscribe({
      next: (response) => {
        const data = response.result;

        if (data) {
          this.username = data.fullName || data.username || 'Student Name';

          if (data.avtUrl) {
            this.userAvatar = data.avtUrl;
          }

          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Không lấy được thông tin user:', err);
      },
    });
  }

  navigateToProfile() {
    // Logic chuyển trang
  }
}
