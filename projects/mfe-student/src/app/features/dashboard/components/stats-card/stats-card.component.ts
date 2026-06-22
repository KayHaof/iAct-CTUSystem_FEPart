import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-card.component.html',
  styleUrl: './stats-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsCardComponent {
  @Input() title = '';
  @Input() value: string | number = 0;
  @Input() subtext = '';

  // Mấy cái màu sắc động này giữ ở Input để tái sử dụng linh hoạt
  @Input() iconBgClass = 'bg-blue-50 text-blue-600';
  @Input() subtextColorClass = 'text-gray-400';

  @Input() showProgress = false;
  @Input() progress = 0;
}
