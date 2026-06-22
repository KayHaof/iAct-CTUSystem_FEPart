import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-progress-circle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-circle">
      <svg [attr.width]="size()" [attr.height]="size()" [attr.viewBox]="'0 0 ' + size() + ' ' + size()">
        <circle
          class="progress-bg"
          [attr.cx]="size() / 2"
          [attr.cy]="size() / 2"
          [attr.r]="radius()"
          [attr.stroke-width]="strokeWidth()"
        />
        <circle
          class="progress-fill progress-fill--{{ color() }}"
          [attr.cx]="size() / 2"
          [attr.cy]="size() / 2"
          [attr.r]="radius()"
          [attr.stroke-width]="strokeWidth()"
          [attr.stroke-dasharray]="circumference()"
          [attr.stroke-dashoffset]="dashOffset()"
        />
      </svg>
      <div class="progress-value">
        <span class="font-bold">{{ percentage() }}%</span>
      </div>
    </div>
  `,
  styles: [`
    .progress-circle {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      svg {
        transform: rotate(-90deg);
      }
    }

    .progress-bg {
      fill: none;
      stroke: var(--border);
    }

    .progress-fill {
      fill: none;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.5s ease;

      &--primary { stroke: var(--primary); }
      &--success { stroke: var(--success); }
      &--warning { stroke: var(--warning); }
      &--danger { stroke: var(--danger); }
    }

    .progress-value {
      position: absolute;
      font-weight: 800;
      font-size: 1.25rem;
      color: var(--text);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressCircleComponent {
  percentage = input.required<number>();
  size = input<number>(120);
  strokeWidth = input<number>(8);
  color = input<'primary' | 'success' | 'warning' | 'danger'>('primary');

  radius = computed(() => (this.size() - this.strokeWidth()) / 2);
  circumference = computed(() => 2 * Math.PI * this.radius());
  dashOffset = computed(() => {
    const percent = Math.min(100, Math.max(0, this.percentage()));
    return this.circumference() * (1 - percent / 100);
  });
}
