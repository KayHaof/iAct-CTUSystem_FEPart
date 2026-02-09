import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, UserInfo } from 'shared-ui';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent {
  public userService = inject(UserService);

  defaultAvatar =
    'https://res.cloudinary.com/dhjamvg6j/image/upload/v1770104643/b8erttd8eughls55igvb.jpg';

  user = computed(() => this.userService.currentUser());

  updateProfile() {
    alert('Tính năng đang phát triển...');
  }
}
