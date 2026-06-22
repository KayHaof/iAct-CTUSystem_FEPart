import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserService } from '@my-mfe/auth';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './server-error.html',
  styleUrls: ['./server-error.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerErrorComponent {
  private readonly userService = inject(UserService);

  readonly dashboardUrl = computed(() =>
    [2, 3].includes(this.userService.currentUser()?.roleType ?? 0)
      ? '/admin/dashboard'
      : '/dashboard',
  );
}
