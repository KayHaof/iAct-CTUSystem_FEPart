import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ClassFilters,
  DepartmentResponse,
  MajorResponse,
} from '../../../../../shared/models/master-data.model';

export type ClassFilterDropdownKey =
  | 'statusFilter'
  | 'departmentFilter'
  | 'majorFilter'
  | 'academicYearFilter';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-class-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-filters.component.html',
  styleUrls: ['./class-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ClassFiltersComponent {
  @Input({ required: true }) filters!: ClassFilters;
  @Input() departments: DepartmentResponse[] = [];
  @Input() majors: MajorResponse[] = [];
  @Input() academicYearOptions: Array<SelectOption<string>> = [];
  @Input() statusFilterOptions: Array<SelectOption<ClassFilters['active']>> = [];
  @Input() openDropdown: ClassFilterDropdownKey | null = null;

  @Output() keywordChange = new EventEmitter<string>();
  @Output() applyFilters = new EventEmitter<void>();
  @Output() resetFilters = new EventEmitter<void>();
  @Output() dropdownToggle = new EventEmitter<ClassFilterDropdownKey>();
  @Output() selectStatus = new EventEmitter<ClassFilters['active']>();
  @Output() selectDepartment = new EventEmitter<ClassFilters['departmentId']>();
  @Output() selectMajor = new EventEmitter<ClassFilters['majorId']>();
  @Output() selectAcademicYear = new EventEmitter<string>();

  isDropdownOpen(key: ClassFilterDropdownKey): boolean {
    return this.openDropdown === key;
  }

  getDepartmentFilterLabel(): string {
    const deptId = this.filters.departmentId;
    if (deptId === '') {
      return 'Tất cả đơn vị';
    }

    return this.departments.find((dept) => dept.id === deptId)?.name || 'Đơn vị đã chọn';
  }

  getMajorFilterLabel(): string {
    const majorId = this.filters.majorId;
    if (majorId === '') {
      return 'Tất cả chuyên ngành';
    }

    return this.majors.find((major) => major.id === majorId)?.name || 'Chuyên ngành đã chọn';
  }

  getAcademicYearFilterLabel(): string {
    return this.filters.academicYear || 'Tất cả khóa';
  }

  getStatusFilterLabel(): string {
    return (
      this.statusFilterOptions.find((option) => option.value === this.filters.active)?.label ||
      'Tất cả'
    );
  }
}
