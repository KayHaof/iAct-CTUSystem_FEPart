import { Component, input, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { UserService } from '@my-mfe/auth';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'lib-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  theme = input<'light' | 'dark'>('light');

  public userService = inject(UserService);

  private layoutService = inject(LayoutService);
  private router = inject(Router);

  currentUser = computed(() => this.userService.currentUser());

  isAdmin = computed(() => this.userService.isAdmin());
  isStudent = computed(() => this.userService.isStudent());
  isDepartment = computed(() => this.userService.isDepartment());

  defaultAvatar =
    'https://res.cloudinary.com/dhjamvg6j/image/upload/v1772527220/0305-logo-ctu_vrk0rw.png';

  adminAvatar = 'https://res.cloudinary.com/dhjamvg6j/image/upload/v1773991699/iact_admin_avt.png';

  toggleMenu() {
    this.layoutService.toggleMobileMenu();
  }

  navigateToProfile() {
    this.layoutService.closeMobileMenu();
    this.router.navigate(['/profile']).then();
  }
}
