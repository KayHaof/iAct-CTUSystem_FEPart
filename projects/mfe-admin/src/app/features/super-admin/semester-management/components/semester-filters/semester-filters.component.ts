import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SemesterFilters } from '../../../../../shared/models/master-data.model';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-semester-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './semester-filters.component.html',
  styleUrls: ['./semester-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SemesterFiltersComponent {
  @Input({ required: true }) filters!: SemesterFilters;
  @Input() openDropdown: 'activeFilter' | 'lockedFilter' | null = null;
  @Input() activeFilterOptions: Array<SelectOption<SemesterFilters['active']>> = [];
  @Input() lockedFilterOptions: Array<SelectOption<SemesterFilters['locked']>> = [];

  @Output() academicYearChange = new EventEmitter<string>();
  @Output() applyFilters = new EventEmitter<void>();
  @Output() resetFilters = new EventEmitter<void>();
  @Output() dropdownToggle = new EventEmitter<'activeFilter' | 'lockedFilter'>();
  @Output() selectActiveFilter = new EventEmitter<SemesterFilters['active']>();
  @Output() selectLockedFilter = new EventEmitter<SemesterFilters['locked']>();

  isDropdownOpen(key: 'activeFilter' | 'lockedFilter'): boolean {
    return this.openDropdown === key;
  }

  getActiveFilterLabel(): string {
    return (
      this.activeFilterOptions.find((option) => option.value === this.filters.active)?.label ||
      'Tất cả'
    );
  }

  getLockedFilterLabel(): string {
    return (
      this.lockedFilterOptions.find((option) => option.value === this.filters.locked)?.label ||
      'Tất cả'
    );
  }
}
