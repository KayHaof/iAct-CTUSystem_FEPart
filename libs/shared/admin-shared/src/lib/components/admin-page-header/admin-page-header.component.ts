import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-admin-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-page-header">
      @if (eyebrow()) {
        <p class="admin-page-header__eyebrow">{{ eyebrow() }}</p>
      }
      <h1 class="admin-page-header__title">{{ title() }}</h1>
      @if (subtitle()) {
        <p class="admin-page-header__subtitle">{{ subtitle() }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .admin-page-header {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 1.5rem 2rem;
      border-top: 3px solid;
      border-image: var(--gradient-primary) 1;
      box-shadow: var(--shadow-sm);
      margin-bottom: 1.5rem;
    }

    .admin-page-header__eyebrow {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }

    .admin-page-header__title {
      font-size: 1.75rem;
      font-weight: 900;
      color: var(--text);
      margin: 0 0 0.25rem;
      line-height: 1.2;
    }

    .admin-page-header__subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      font-weight: 500;
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageHeaderComponent {
  title = input.required<string>();
  eyebrow = input<string>();
  subtitle = input<string>();
}
