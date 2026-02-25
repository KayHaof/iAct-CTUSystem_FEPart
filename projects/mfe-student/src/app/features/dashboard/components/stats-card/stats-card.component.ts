import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-card.component.html',
  styleUrl: './stats-card.component.scss',
})
export class StatsCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = 0;
  @Input() subtext: string = '';

  // Mấy cái màu sắc động này giữ ở Input để tái sử dụng linh hoạt
  @Input() iconBgClass: string = 'bg-blue-50 text-blue-600';
  @Input() subtextColorClass: string = 'text-gray-400';

  @Input() showProgress: boolean = false;
  @Input() progress: number = 0;
}
