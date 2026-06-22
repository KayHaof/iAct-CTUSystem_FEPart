import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ClassResponse,
  DepartmentResponse,
  MajorResponse,
} from '../../../../../shared/models/master-data.model';

export type ClassFormDropdownKey =
  | 'departmentForm'
  | 'majorForm'
  | 'academicYearForm'
  | 'activeForm';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-class-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-form-modal.component.html',
  styleUrls: ['./class-form-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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
  @Input() openDropdown: ClassFormDropdownKey | null = null;
  @Input() activeDepartments: DepartmentResponse[] = [];
  @Input() activeMajorsByDepartment: MajorResponse[] = [];
  @Input() academicYearOptions: Array<SelectOption<string>> = [];
  @Input() activeFormOptions: Array<SelectOption<boolean>> = [];

  @Output() modalClosed = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() nameChange = new EventEmitter<string>();
  @Output() classCodeChange = new EventEmitter<string>();
  @Output() dropdownToggle = new EventEmitter<ClassFormDropdownKey>();
  @Output() selectDepartment = new EventEmitter<number | ''>();
  @Output() selectMajor = new EventEmitter<number | ''>();
  @Output() selectAcademicYear = new EventEmitter<string>();
  @Output() selectActive = new EventEmitter<boolean>();

  isDropdownOpen(key: ClassFormDropdownKey): boolean {
    return this.openDropdown === key;
  }

  getDepartmentFormLabel(): string {
    const deptId = this.form.departmentId;
    if (deptId === '') {
      return 'Chọn đơn vị quản lý';
    }

    return this.activeDepartments.find((dept) => dept.id === deptId)?.name || 'Đơn vị đã chọn';
  }

  getMajorFormLabel(): string {
    const majorId = this.form.majorId;
    if (majorId === '') {
      return 'Chọn chuyên ngành';
    }

    return (
      this.activeMajorsByDepartment.find((major) => major.id === majorId)?.name ||
      'Chuyên ngành đã chọn'
    );
  }

  getAcademicYearFormLabel(): string {
    const year = this.form.academicYear;
    if (!year) {
      return 'Chọn khóa tuyển sinh';
    }

    return this.academicYearOptions.find((opt) => opt.value === year)?.label || year;
  }

  getActiveFormLabel(): string {
    return this.form.isActive ? 'Đang hoạt động' : 'Tạm ngừng';
  }
}
