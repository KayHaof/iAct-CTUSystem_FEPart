import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '@my-mfe/auth';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './not-found.html',
  styleUrls: ['./not-found.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
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
