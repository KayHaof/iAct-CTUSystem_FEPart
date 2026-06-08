import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DepartmentResponse, MajorFilters } from '../../../../../shared/models/master-data.model';

export type MajorFilterDropdownKey = 'statusFilter' | 'departmentFilter' | 'programFilter';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-major-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './major-filters.component.html',
  styleUrls: ['./major-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MajorFiltersComponent {
  @Input({ required: true }) filters!: MajorFilters;
  @Input({ required: true }) departments: DepartmentResponse[] = [];
  @Input() openDropdown: MajorFilterDropdownKey | null = null;
  @Input() statusFilterOptions: Array<SelectOption<MajorFilters['active']>> = [];
  @Input() programTypeOptions: Array<SelectOption<string>> = [];

  @Output() filterKeywordChange = new EventEmitter<string>();
  @Output() applyFilters = new EventEmitter<void>();
  @Output() resetFilters = new EventEmitter<void>();
  @Output() dropdownToggle = new EventEmitter<
    'statusFilter' | 'departmentFilter' | 'programFilter'
  >();
  @Output() dropdownClose = new EventEmitter<void>();
  @Output() selectStatus = new EventEmitter<MajorFilters['active']>();
  @Output() selectDepartment = new EventEmitter<MajorFilters['departmentId']>();
  @Output() selectProgram = new EventEmitter<string>();

  isDropdownOpen(key: MajorFilterDropdownKey): boolean {
    return this.openDropdown === key;
  }

  getDepartmentFilterLabel(): string {
    const departmentId = this.filters.departmentId;
    if (departmentId === '') {
      return 'Tất cả đơn vị';
    }

    return (
      this.departments.find((department) => department.id === departmentId)?.name ||
      'Đơn vị đã chọn'
    );
  }

  getStatusFilterLabel(): string {
    return (
      this.statusFilterOptions.find((option) => option.value === this.filters.active)?.label ||
      'Tất cả'
    );
  }

  getProgramFilterLabel(): string {
    return this.filters.programType || 'Tất cả hệ đào tạo';
  }

  onKeywordChange(value: string): void {
    this.filterKeywordChange.emit(value);
  }
}
