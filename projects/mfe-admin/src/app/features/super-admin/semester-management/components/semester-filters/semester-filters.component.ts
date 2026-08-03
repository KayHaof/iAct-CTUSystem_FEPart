import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomSelectComponent, CustomSelectOption, CustomSelectValue } from '@my-mfe/ui';

import { SemesterFilters, SemesterResponse } from '../../../../../shared/models/master-data.model';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-semester-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './semester-filters.component.html',
  styleUrls: ['./semester-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SemesterFiltersComponent {
  @Input({ required: true }) filters!: SemesterFilters;
  @Input() semesters: SemesterResponse[] = [];
  @Input() activeFilterOptions: Array<SelectOption<SemesterFilters['active']>> = [];
  @Input() lockedFilterOptions: Array<SelectOption<SemesterFilters['locked']>> = [];

  @Output() academicYearChange = new EventEmitter<string>();
  @Output() applyFilters = new EventEmitter<void>();
  @Output() resetFilters = new EventEmitter<void>();
  @Output() selectActiveFilter = new EventEmitter<SemesterFilters['active']>();
  @Output() selectLockedFilter = new EventEmitter<SemesterFilters['locked']>();

  getTotalCount(): number {
    return this.semesters.length;
  }

  getActiveSemesterName(): string {
    const semester = this.semesters.find((item) => item.isActive);
    return semester?.name || semester?.semesterName || 'Chưa có';
  }

  getLockedCount(): number {
    return this.semesters.filter((semester) => semester.isLocked).length;
  }

  getOpenCount(): number {
    return this.semesters.filter((semester) => !semester.isLocked).length;
  }

  getActiveCount(value: SemesterFilters['active']): number {
    if (value === '') {
      return this.semesters.length;
    }

    return this.semesters.filter((semester) =>
      value === 'true' ? semester.isActive : !semester.isActive,
    ).length;
  }

  getLockedOptionCount(value: SemesterFilters['locked']): number {
    if (value === '') {
      return this.semesters.length;
    }

    return this.semesters.filter((semester) =>
      value === 'true' ? semester.isLocked : !semester.isLocked,
    ).length;
  }

  getActiveOptions(): CustomSelectOption[] {
    return this.activeFilterOptions.map((option) => ({
      label: option.label,
      value: option.value,
      description: `${option.description || 'Trạng thái áp dụng'} · ${this.getActiveCount(option.value)} học kỳ`,
      icon: option.value === 'true' ? 'bi-check-circle' : option.value === 'false' ? 'bi-circle' : 'bi-ui-checks-grid',
    }));
  }

  getLockedOptions(): CustomSelectOption[] {
    return this.lockedFilterOptions.map((option) => ({
      label: option.label,
      value: option.value,
      description: `${option.description || 'Trạng thái khóa'} · ${this.getLockedOptionCount(option.value)} học kỳ`,
      icon: option.value === 'true' ? 'bi-lock' : option.value === 'false' ? 'bi-unlock' : 'bi-shield-check',
    }));
  }

  onActiveChange(value: CustomSelectValue): void {
    this.selectActiveFilter.emit((value ?? '') as SemesterFilters['active']);
  }

  onLockedChange(value: CustomSelectValue): void {
    this.selectLockedFilter.emit((value ?? '') as SemesterFilters['locked']);
  }
}
