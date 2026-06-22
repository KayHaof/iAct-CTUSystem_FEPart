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

import { DepartmentResponse } from '../../../../../shared/models/master-data.model';

export type DepartmentFormDropdownKey = 'activeForm';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-department-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './department-form-modal.component.html',
  styleUrls: ['./department-form-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DepartmentFormModalComponent {
  @Input() isOpen = false;
  @Input() isSaving = false;
  @Input() editingDepartment: DepartmentResponse | null = null;
  @Input({ required: true }) form!: {
    name: string;
    code: string;
    description: string;
    phone: string;
    address: string;
    avatarUrl: string;
    isActive: boolean;
  };
  @Input() openDropdown: DepartmentFormDropdownKey | null = null;
  @Input() activeFormOptions: Array<SelectOption<boolean>> = [];

  @Output() modalClosed = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() nameChange = new EventEmitter<string>();
  @Output() codeChange = new EventEmitter<string>();
  @Output() descriptionChange = new EventEmitter<string>();
  @Output() phoneChange = new EventEmitter<string>();
  @Output() addressChange = new EventEmitter<string>();
  @Output() avatarUrlChange = new EventEmitter<string>();
  @Output() dropdownToggle = new EventEmitter<DepartmentFormDropdownKey>();
  @Output() selectActive = new EventEmitter<boolean>();

  isDropdownOpen(key: DepartmentFormDropdownKey): boolean {
    return this.openDropdown === key;
  }

  getActiveFormLabel(): string {
    return this.form.isActive ? 'Đang hoạt động' : 'Tạm ngừng';
  }
}
