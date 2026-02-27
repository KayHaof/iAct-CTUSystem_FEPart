import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AdminStat {
  label: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'orange' | 'purple' | 'green';
  trend?: string;
}

@Component({
  selector: 'app-admin-stats-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      @for (stat of items(); track stat.label) {
        <div
          class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-3 mb-2">
            <div
              [ngClass]="{
                'bg-blue-50 text-blue-600': stat.color === 'blue',
                'bg-orange-50 text-orange-600': stat.color === 'orange',
                'bg-purple-50 text-purple-600': stat.color === 'purple',
                'bg-green-50 text-green-600': stat.color === 'green',
              }"
              class="p-2 rounded-lg"
            >
              <i [class]="stat.icon" class="text-xl"></i>
            </div>
            @if (stat.trend) {
              <span class="text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-600">
                {{ stat.trend }}
              </span>
            }
          </div>
          <p class="text-gray-500 text-sm font-medium">{{ stat.label }}</p>
          <h3 class="text-3xl font-bold text-gray-800">{{ stat.value }}</h3>
        </div>
      }
    </div>
  `,
})
export class StatsGridComponent {
  items = input.required<AdminStat[]>();
}
