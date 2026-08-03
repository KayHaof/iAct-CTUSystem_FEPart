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
  selector: 'app-class-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './class-form-modal.component.html',
  styleUrls: ['./class-form-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ClassFormModalComponent {
  @Input() isOpen = false;
  @Input() isSaving = false;
  @Input() editingClass: ClassResponse | null = null;
  @Input({ required: true }) form!: {
    name: string;
    classCode: string;
    departmentId: number | '';
    majorId: number | '';
    academicYear: string;
    isActive: boolean;
  };
  @Input() activeDepartments: DepartmentResponse[] = [];
  @Input() activeMajorsByDepartment: MajorResponse[] = [];
  @Input() academicYearOptions: Array<SelectOption<string>> = [];
  @Input() activeFormOptions: Array<SelectOption<boolean>> = [];

  @Output() modalClosed = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() nameChange = new EventEmitter<string>();
  @Output() classCodeChange = new EventEmitter<string>();
  @Output() selectDepartment = new EventEmitter<number | ''>();
  @Output() selectMajor = new EventEmitter<number | ''>();
  @Output() selectAcademicYear = new EventEmitter<string>();
  @Output() selectActive = new EventEmitter<boolean>();

  getDepartmentOptions(): CustomSelectOption[] {
    if (this.activeDepartments.length === 0) {
      return [
        {
          label: 'Chưa có đơn vị đang hoạt động',
          value: '',
          description: 'Cần kích hoạt đơn vị trước khi tạo lớp',
          icon: 'bi-building-slash',
          disabled: true,
        },
      ];
    }

    return this.activeDepartments.map((department) => ({
      label: department.name,
      value: department.id,
      description: department.code || 'Chưa có mã',
      icon: 'bi-building',
    }));
  }

  getMajorOptions(): CustomSelectOption[] {
    if (this.activeMajorsByDepartment.length === 0) {
      return [
        {
          label: 'Chưa có chuyên ngành phù hợp',
          value: '',
          description: 'Vui lòng chọn đơn vị trước',
          icon: 'bi-mortarboard',
          disabled: true,
        },
      ];
    }

    return this.activeMajorsByDepartment.map((major) => ({
      label: major.name,
      value: major.id,
      description: major.code || 'Chưa có mã',
      icon: 'bi-mortarboard',
    }));
  }

  getAcademicYearOptions(): CustomSelectOption[] {
    return this.academicYearOptions.map((option) => ({
      label: option.label,
      value: option.value,
      description: option.description || 'Khóa tuyển sinh',
      icon: 'bi-calendar3',
    }));
  }

  getActiveOptions(): CustomSelectOption[] {
    return this.activeFormOptions.map((option) => ({
      label: option.label,
      value: option.value,
      description: option.description,
      icon: option.value ? 'bi-check-circle' : 'bi-pause-circle',
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

  onActiveChange(value: CustomSelectValue): void {
    this.selectActive.emit(value === false ? false : true);
  }
}
