import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-admin-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-stat-card admin-stat-card--{{ variant() }}">
      <div class="stat-header">
        <div class="stat-icon stat-icon--{{ variant() }}">
          <ng-content select="[icon]"></ng-content>
        </div>
        @if (trend()) {
          <span class="stat-trend stat-trend--{{ trendDirection() }}">
            {{ trend() }}
          </span>
        }
      </div>
      <div class="stat-value">{{ value() }}</div>
      <div class="stat-label">{{ label() }}</div>
      @if (meta()) {
        <div class="stat-meta">
          <span class="stat-dot stat-dot--{{ metaColor() }}"></span>
          {{ meta() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-stat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 1.25rem 1.5rem;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        opacity: 0.9;
      }

      &:hover {
        border-color: rgba(37, 99, 235, 0.2);
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      &--primary::before { background: var(--gradient-primary); }
      &--success::before { background: var(--gradient-success); }
      &--warning::before { background: var(--gradient-warning); }
      &--danger::before { background: var(--gradient-danger); }
      &--info::before { background: linear-gradient(135deg, #0284c7, #0ea5e9); }
    }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .stat-icon {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;

      &--primary { background: var(--primary-light); color: var(--primary); }
      &--info { background: var(--info-bg); color: var(--info); }
      &--success { background: var(--success-bg); color: var(--success); }
      &--warning { background: var(--warning-bg); color: var(--warning); }
    }

    .stat-trend {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-full);
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;

      &--up { background: var(--success-bg); color: var(--success); }
      &--neutral { background: rgba(148, 163, 184, 0.08); color: #94a3b8; }
    }

    .stat-value {
      font-size: 2.25rem;
      font-weight: 900;
      color: var(--text);
      line-height: 1;
      margin-bottom: 0.375rem;
      letter-spacing: -0.02em;
    }

    .stat-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }

    .stat-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-disabled);
      font-weight: 500;
    }

    .stat-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;

      &--emerald { background: var(--success); }
      &--blue { background: var(--info); }
      &--amber { background: var(--warning); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStatCardComponent {
  value = input.required<string | number>();
  label = input.required<string>();
  variant = input<'primary' | 'success' | 'warning' | 'danger' | 'info'>('primary');
  trend = input<string>();
  trendDirection = input<'up' | 'neutral'>('neutral');
  meta = input<string>();
  metaColor = input<'emerald' | 'blue' | 'amber'>('emerald');
}
