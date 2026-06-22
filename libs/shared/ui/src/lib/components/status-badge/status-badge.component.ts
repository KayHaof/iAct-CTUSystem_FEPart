import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface StatusConfig {
  label: string;
  variant: BadgeVariant;
  dot?: boolean;
}

@Component({
  selector: 'lib-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="badge"
      [class]="'badge--' + variant"
      [class.badge--sm]="size === 'sm'"
      [class.badge--lg]="size === 'lg'"
      [class.badge--with-dot]="dot"
    >
      @if (dot) {
        <span class="badge-dot"></span>
      }
      <span class="badge-label">{{ label }}</span>
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.75rem;
        border-radius: var(--radius-full, 9999px);
        font-size: 0.75rem;
        font-weight: 600;
        line-height: 1;
        white-space: nowrap;
      }

      .badge--sm {
        padding: 0.125rem 0.5rem;
        font-size: 0.6875rem;
      }

      .badge--lg {
        padding: 0.375rem 1rem;
        font-size: 0.875rem;
      }

      .badge-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      /* Variants */
      .badge--success {
        background: var(--success-bg, rgba(16, 185, 129, 0.1));
        color: var(--success, #10b981);

        .badge-dot {
          background: var(--success, #10b981);
        }
      }

      .badge--warning {
        background: var(--warning-bg, rgba(245, 158, 11, 0.1));
        color: var(--warning, #f59e0b);

        .badge-dot {
          background: var(--warning, #f59e0b);
        }
      }

      .badge--danger {
        background: var(--danger-bg, rgba(239, 68, 68, 0.1));
        color: var(--danger, #ef4444);

        .badge-dot {
          background: var(--danger, #ef4444);
        }
      }

      .badge--info {
        background: var(--info-bg, rgba(14, 165, 233, 0.1));
        color: var(--info, #0ea5e9);

        .badge-dot {
          background: var(--info, #0ea5e9);
        }
      }

      .badge--neutral {
        background: rgba(100, 116, 139, 0.1);
        color: #64748b;

        .badge-dot {
          background: #64748b;
        }
      }

      .badge--primary {
        background: var(--primary-light, rgba(37, 99, 235, 0.1));
        color: var(--primary, #2563eb);

        .badge-dot {
          background: var(--primary, #2563eb);
        }
      }
    `,
  ],
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() variant: BadgeVariant = 'neutral';
  @Input() size: BadgeSize = 'md';
  @Input() dot = false;
}
