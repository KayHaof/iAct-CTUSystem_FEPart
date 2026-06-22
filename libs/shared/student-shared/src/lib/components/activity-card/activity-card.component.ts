import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-activity-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-card" (click)="cardClick.emit(activity())">
      @if (imageUrl()) {
        <div class="activity-card-image">
          <img [src]="imageUrl()" [alt]="activity().name" class="w-full h-full object-cover" />
        </div>
      } @else {
        <div class="activity-card-image flex items-center justify-center">
          <span class="text-gray-400 text-sm">Khong co anh</span>
        </div>
      }
      <div class="activity-card-content">
        <div class="flex items-center justify-between mb-2">
          <span class="activity-badge">{{ activity().categoryName || 'Chua phan loai' }}</span>
          @if (statusBadge()) {
            <span class="badge-{{ statusColor() }}">{{ statusBadge() }}</span>
          }
        </div>
        <h3 class="font-bold text-gray-900 mb-1 line-clamp-2">{{ activity().name }}</h3>
        <p class="text-sm text-gray-500 mb-3 line-clamp-2">{{ activity().description }}</p>
        <div class="flex items-center justify-between text-xs text-gray-400">
          <span>{{ activity().startDate | date:'dd/MM/yyyy' }}</span>
          <span>{{ activity().location || 'Chua xac dinh' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .activity-card {
      background: var(--bg);
      border-radius: var(--radius-2xl);
      border: 1px solid var(--border);
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: var(--primary);
      }
    }

    .activity-card-image {
      aspect-ratio: 16/9;
      background: linear-gradient(135deg, #eff6ff, #f0f9ff);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .activity-card-content {
      padding: 1rem;
    }

    .activity-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--primary-light);
      color: var(--primary);
    }

    .badge-success { background: var(--success-bg); color: var(--success); }
    .badge-warning { background: var(--warning-bg); color: var(--warning); }
    .badge-danger { background: var(--danger-bg); color: var(--danger); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCardComponent {
  activity = input.required<any>();
  imageUrl = input<string>();
  statusBadge = input<string>();
  statusColor = input<'success' | 'warning' | 'danger'>('success');
  cardClick = output<any>();
}
