import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'lib-admin-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
          class="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
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
