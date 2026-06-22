import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '@my-mfe/auth';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './forbidden.html',
  styleUrls: ['./forbidden.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenComponent {
  private readonly location = inject(Location);
  private readonly userService = inject(UserService);

  readonly dashboardUrl = computed(() =>
    [2, 3].includes(this.userService.currentUser()?.roleType ?? 0)
      ? '/admin/dashboard'
      : '/dashboard',
  );

  goBack(): void {
    this.location.back();
  }
}
