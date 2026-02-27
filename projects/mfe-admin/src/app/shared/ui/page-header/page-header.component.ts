import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h2 class="text-2xl font-bold text-gray-800">{{ title() }}</h2>
      <div class="flex flex-wrap gap-4 w-full md:w-auto">
        <div class="relative flex-grow md:flex-grow-0">
          <i class="bi bi-search absolute left-3 top-2.5 text-gray-400"></i>
          <input
            type="text"
            [placeholder]="searchPlaceholder()"
            (input)="onSearch($event)"
            class="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <button
          [routerLink]="actionLink()"
          class="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
        >
          <i class="bi bi-plus-lg"></i> {{ actionLabel() }}
        </button>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  title = input.required<string>();
  searchPlaceholder = input<string>('Search...');
  actionLabel = input.required<string>();
  actionLink = input.required<string>();
  searchChange = output<string>();

  onSearch(event: Event) {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }
}
