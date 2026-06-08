import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  DepartmentResponse,
  MajorRequest,
  MajorResponse,
} from '../../../../../shared/models/master-data.model';

export type MajorFormDropdownKey = 'departmentForm' | 'programForm' | 'activeForm';

type MajorDropdownKey = 'departmentForm' | 'programForm' | 'activeForm';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-major-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './major-form-modal.component.html',
  styleUrls: ['./major-form-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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
  @Input() openDropdown: MajorFormDropdownKey | null = null;
  @Input() activeDepartments: DepartmentResponse[] = [];
  @Input() programTypeOptions: Array<SelectOption<string>> = [];
  @Input() activeFormOptions: Array<SelectOption<boolean>> = [];

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() nameChange = new EventEmitter<string>();
  @Output() codeChange = new EventEmitter<string>();
  @Output() dropdownToggle = new EventEmitter<MajorDropdownKey>();
  @Output() selectDepartment = new EventEmitter<number | ''>();
  @Output() selectProgram = new EventEmitter<string>();
  @Output() selectActive = new EventEmitter<boolean>();

  isDropdownOpen(key: MajorFormDropdownKey): boolean {
    return this.openDropdown === key;
  }

  getDepartmentFormLabel(): string {
    const departmentId = this.form.departmentId;
    if (departmentId === '') {
      return 'Chọn đơn vị quản lý';
    }

    return (
      this.activeDepartments.find((department) => department.id === departmentId)?.name ||
      'Đơn vị đã chọn'
    );
  }

  getProgramFormLabel(): string {
    return this.form.programType || 'Chọn hệ đào tạo';
  }

  getActiveFormLabel(): string {
    return this.form.isActive ? 'Đang hoạt động' : 'Tạm ngừng';
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
