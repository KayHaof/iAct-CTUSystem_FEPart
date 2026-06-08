import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SemesterResponse } from '../../../../../shared/models/master-data.model';

export type SemesterFormDropdownKey = 'statusForm';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-semester-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './semester-form-modal.component.html',
  styleUrls: ['./semester-form-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SemesterFormModalComponent {
  @Input() isOpen = false;
  @Input() isSaving = false;
  @Input() editingSemester: SemesterResponse | null = null;
  @Input({ required: true }) form!: {
    name: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    isLocked: boolean;
  };
  @Input() openDropdown: SemesterFormDropdownKey | null = null;
  @Input() statusFormOptions: Array<SelectOption<boolean>> = [];

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() nameChange = new EventEmitter<string>();
  @Output() academicYearChange = new EventEmitter<string>();
  @Output() startDateChange = new EventEmitter<string>();
  @Output() endDateChange = new EventEmitter<string>();
  @Output() isLockedChange = new EventEmitter<boolean>();
  @Output() dropdownToggle = new EventEmitter<SemesterFormDropdownKey>();
  @Output() selectStatus = new EventEmitter<boolean>();

  isDropdownOpen(key: SemesterFormDropdownKey): boolean {
    return this.openDropdown === key;
  }

  getStatusFormLabel(): string {
    return this.form.isActive ? 'Đang áp dụng' : 'Chưa áp dụng';
  }
}
