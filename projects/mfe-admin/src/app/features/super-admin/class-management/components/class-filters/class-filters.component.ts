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
  ClassFilters,
  ClassResponse,
  DepartmentResponse,
  MajorResponse,
} from '../../../../../shared/models/master-data.model';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-class-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './class-filters.component.html',
  styleUrls: ['./class-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ClassFiltersComponent {
  @Input({ required: true }) filters!: ClassFilters;
  @Input() allClasses: ClassResponse[] = [];
  @Input() departments: DepartmentResponse[] = [];
  @Input() majors: MajorResponse[] = [];
  @Input() academicYearOptions: Array<SelectOption<string>> = [];
  @Input() statusFilterOptions: Array<SelectOption<ClassFilters['active']>> = [];

  @Output() keywordChange = new EventEmitter<string>();
  @Output() applyFilters = new EventEmitter<void>();
  @Output() resetFilters = new EventEmitter<void>();
  @Output() selectStatus = new EventEmitter<ClassFilters['active']>();
  @Output() selectDepartment = new EventEmitter<ClassFilters['departmentId']>();
  @Output() selectMajor = new EventEmitter<ClassFilters['majorId']>();
  @Output() selectAcademicYear = new EventEmitter<string>();

  getTotalCount(): number {
    return this.allClasses.length;
  }

  getStatusCount(value: ClassFilters['active']): number {
    if (value === '') {
      return this.allClasses.length;
    }

    return this.allClasses.filter((cls) =>
      value === 'true' ? cls.isActive !== false : cls.isActive === false,
    ).length;
  }

  getDepartmentCount(departmentId: ClassFilters['departmentId']): number {
    if (departmentId === '') {
      return this.allClasses.length;
    }

    return this.allClasses.filter((cls) => cls.departmentId === departmentId).length;
  }

  getMajorCount(majorId: ClassFilters['majorId']): number {
    if (majorId === '') {
      return this.allClasses.length;
    }

    return this.allClasses.filter((cls) => cls.majorId === majorId).length;
  }

  getAcademicYearCount(academicYear: string): number {
    if (!academicYear) {
      return this.allClasses.length;
    }

    return this.allClasses.filter((cls) => cls.academicYear === academicYear).length;
  }

  getDepartmentWithClassCount(): number {
    return new Set(
      this.allClasses
        .map((cls) => cls.departmentId)
        .filter((departmentId): departmentId is number => departmentId != null),
    ).size;
  }

  getDepartmentOptions(): CustomSelectOption[] {
    return [
      {
        label: 'Tất cả đơn vị',
        value: '',
        description: `${this.getDepartmentCount('')} lớp sinh hoạt`,
        icon: 'bi-building',
      },
      ...this.departments.map((department) => ({
        label: department.name,
        value: department.id,
        description: `${department.code || 'Chưa có mã'} · ${this.getDepartmentCount(department.id)} lớp`,
        icon: 'bi-building',
      })),
    ];
  }

  getMajorOptions(): CustomSelectOption[] {
    return [
      {
        label: 'Tất cả chuyên ngành',
        value: '',
        description: `${this.getMajorCount('')} lớp sinh hoạt`,
        icon: 'bi-mortarboard',
      },
      ...this.majors.map((major) => ({
        label: major.name,
        value: major.id,
        description: `${major.code || 'Chưa có mã'} · ${this.getMajorCount(major.id)} lớp`,
        icon: 'bi-mortarboard',
      })),
    ];
  }

  getAcademicYearOptions(): CustomSelectOption[] {
    return [
      {
        label: 'Tất cả khóa',
        value: '',
        description: `${this.getAcademicYearCount('')} lớp sinh hoạt`,
        icon: 'bi-calendar3',
      },
      ...this.academicYearOptions.map((option) => ({
        label: option.label,
        value: option.value,
        description: `${this.getAcademicYearCount(option.value)} lớp sinh hoạt`,
        icon: 'bi-calendar3',
      })),
    ];
  }

  getStatusOptions(): CustomSelectOption[] {
    return this.statusFilterOptions.map((option) => ({
      label: option.label,
      value: option.value,
      description: `${option.description || 'Trạng thái'} · ${this.getStatusCount(option.value)} lớp`,
      icon: option.value === 'false' ? 'bi-pause-circle' : option.value === 'true' ? 'bi-check-circle' : 'bi-ui-checks-grid',
    }));
  }

  onDepartmentChange(value: CustomSelectValue): void {
    this.selectDepartment.emit(typeof value === 'number' ? value : '');
  }

  onMajorChange(value: CustomSelectValue): void {
    this.selectMajor.emit(typeof value === 'number' ? value : '');
  }

  onAcademicYearChange(value: CustomSelectValue): void {
    this.selectAcademicYear.emit(typeof value === 'string' ? value : '');
  }

  onStatusChange(value: CustomSelectValue): void {
    this.selectStatus.emit((value ?? '') as ClassFilters['active']);
  }
}
