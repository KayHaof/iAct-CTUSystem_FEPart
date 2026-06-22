import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'lib-loading-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-bar.component.html',
  styleUrls: ['./loading-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingBarComponent {
  loadingService = inject(LoadingService);
}
