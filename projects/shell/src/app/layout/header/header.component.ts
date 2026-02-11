import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { UserService } from '@my-mfe/auth';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  public userService = inject(UserService);

  private layoutService = inject(LayoutService);
  private router = inject(Router);

  currentUser = computed(() => this.userService.currentUser());

  // Check role
  isAdmin = computed(() => this.userService.isAdmin()); // Cầu nối isAdmin
  isStudent = computed(() => this.userService.isStudent());

  defaultAvatar =
    'https://res.cloudinary.com/dhjamvg6j/image/upload/v1770104643/b8erttd8eughls55igvb.jpg';

  toggleMenu() {
    this.layoutService.toggleMobileMenu();
  }

  navigateToProfile() {
    this.layoutService.closeMobileMenu();
    this.router.navigate(['/profile']);
  }
}
