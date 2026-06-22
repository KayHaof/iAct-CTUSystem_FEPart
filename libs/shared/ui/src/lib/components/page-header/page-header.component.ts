import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'lib-admin-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
      <div>
        <h2 class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
          {{ title() }}
        </h2>
      </div>

      <div class="w-full sm:w-auto">
        <button
          [routerLink]="actionLink()"
          class="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-sky-600 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:w-auto"
        >
          <i class="bi bi-plus-lg text-lg leading-none"></i>
          {{ actionLabel() }}
        </button>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  title = input.required<string>();
  actionLabel = input.required<string>();
  actionLink = input.required<string>();
}
