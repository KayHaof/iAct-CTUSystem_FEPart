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
  MajorResponse,
} from '../../../../../shared/models/master-data.model';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-major-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './major-form-modal.component.html',
  styleUrls: ['./major-form-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MajorFormModalComponent {
  @Input({ required: true }) isOpen = false;
  @Input({ required: true }) isSaving = false;
  @Input() editingMajor: MajorResponse | null = null;
  @Input({ required: true }) form!: {
    name: string;
    code: string;
    programType: string;
    departmentId: number | '';
    isActive: boolean;
  };
  @Input() activeDepartments: DepartmentResponse[] = [];
  @Input() programTypeOptions: Array<SelectOption<string>> = [];
  @Input() activeFormOptions: Array<SelectOption<boolean>> = [];

  @Output() modalClosed = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() nameChange = new EventEmitter<string>();
  @Output() codeChange = new EventEmitter<string>();
  @Output() selectDepartment = new EventEmitter<number | ''>();
  @Output() selectProgram = new EventEmitter<string>();
  @Output() selectActive = new EventEmitter<boolean>();

  getDepartmentOptions(): CustomSelectOption[] {
    if (this.activeDepartments.length === 0) {
      return [
        {
          label: 'Chưa có đơn vị đang hoạt động',
          value: '',
          description: 'Cần kích hoạt đơn vị trước khi gán chuyên ngành',
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

  getProgramOptions(): CustomSelectOption[] {
    return this.programTypeOptions.map((option) => ({
      label: option.label,
      value: option.value,
      description: option.description,
      icon: 'bi-mortarboard',
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

  onProgramChange(value: CustomSelectValue): void {
    this.selectProgram.emit(typeof value === 'string' ? value : '');
  }

  onActiveChange(value: CustomSelectValue): void {
    this.selectActive.emit(value === false ? false : true);
  }

  onSubmit(): void {
    this.save.emit();
  }

  onNameChange(value: string): void {
    this.nameChange.emit(value);
  }

  onCodeChange(value: string): void {
    this.codeChange.emit(value);
  }
}
