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

import {
  DepartmentResponse,
  MajorFilters,
  MajorResponse,
} from '../../../../../shared/models/master-data.model';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-major-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './major-filters.component.html',
  styleUrls: ['./major-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MajorFiltersComponent {
  @Input({ required: true }) filters!: MajorFilters;
  @Input({ required: true }) departments: DepartmentResponse[] = [];
  @Input() allMajors: MajorResponse[] = [];
  @Input() statusFilterOptions: Array<SelectOption<MajorFilters['active']>> = [];
  @Input() programTypeOptions: Array<SelectOption<string>> = [];

  @Output() filterKeywordChange = new EventEmitter<string>();
  @Output() applyFilters = new EventEmitter<void>();
  @Output() resetFilters = new EventEmitter<void>();
  @Output() selectStatus = new EventEmitter<MajorFilters['active']>();
  @Output() selectDepartment = new EventEmitter<MajorFilters['departmentId']>();
  @Output() selectProgram = new EventEmitter<string>();

  getTotalCount(): number {
    return this.allMajors.length;
  }

  getStatusCount(value: MajorFilters['active']): number {
    if (value === '') {
      return this.allMajors.length;
    }

    return this.allMajors.filter((major) =>
      value === 'true' ? major.isActive !== false : major.isActive === false,
    ).length;
  }

  getDepartmentCount(departmentId: MajorFilters['departmentId']): number {
    if (departmentId === '') {
      return this.allMajors.length;
    }

    return this.allMajors.filter((major) => major.departmentId === departmentId).length;
  }

  getProgramCount(programType: string): number {
    if (!programType) {
      return this.allMajors.length;
    }

    return this.allMajors.filter((major) => major.programType === programType).length;
  }

  getDepartmentOptions(): CustomSelectOption[] {
    return [
      {
        label: 'Tất cả đơn vị',
        value: '',
        description: `${this.getDepartmentCount('')} chuyên ngành`,
        icon: 'bi-building',
      },
      ...this.departments.map((department) => ({
        label: department.name,
        value: department.id,
        description: `${department.code || 'Chưa có mã'} · ${this.getDepartmentCount(department.id)} chuyên ngành`,
        icon: 'bi-building',
      })),
    ];
  }

  getStatusOptions(): CustomSelectOption[] {
    return this.statusFilterOptions.map((option) => ({
      label: option.label,
      value: option.value,
      description: `${option.description || 'Trạng thái'} · ${this.getStatusCount(option.value)} chuyên ngành`,
      icon:
        option.value === 'false'
          ? 'bi-pause-circle'
          : option.value === 'true'
            ? 'bi-check-circle'
            : 'bi-ui-checks-grid',
    }));
  }

  getProgramOptions(): CustomSelectOption[] {
    return [
      {
        label: 'Tất cả hệ đào tạo',
        value: '',
        description: `${this.getProgramCount('')} chuyên ngành`,
        icon: 'bi-mortarboard',
      },
      ...this.programTypeOptions.map((option) => ({
        label: option.label,
        value: option.value,
        description: `${option.description || 'Hệ đào tạo'} · ${this.getProgramCount(option.value)} chuyên ngành`,
        icon: 'bi-mortarboard',
      })),
    ];
  }

  onDepartmentChange(value: CustomSelectValue): void {
    this.selectDepartment.emit(typeof value === 'number' ? value : '');
  }

  onStatusChange(value: CustomSelectValue): void {
    this.selectStatus.emit((value ?? '') as MajorFilters['active']);
  }

  onProgramChange(value: CustomSelectValue): void {
    this.selectProgram.emit(typeof value === 'string' ? value : '');
  }

  onKeywordChange(value: string): void {
    this.filterKeywordChange.emit(value);
  }
}
