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

import { SemesterResponse } from '../../../../../shared/models/master-data.model';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-semester-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './semester-form-modal.component.html',
  styleUrls: ['./semester-form-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
  @Input() statusFormOptions: Array<SelectOption<boolean>> = [];

  @Output() modalClosed = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() nameChange = new EventEmitter<string>();
  @Output() academicYearChange = new EventEmitter<string>();
  @Output() startDateChange = new EventEmitter<string>();
  @Output() endDateChange = new EventEmitter<string>();
  @Output() isLockedChange = new EventEmitter<boolean>();
  @Output() selectStatus = new EventEmitter<boolean>();

  getStatusOptions(): CustomSelectOption[] {
    return this.statusFormOptions.map((option) => ({
      label: option.label,
      value: option.value,
      description: option.description,
      icon: option.value ? 'bi-check-circle' : 'bi-circle',
    }));
  }

  onStatusChange(value: CustomSelectValue): void {
    this.selectStatus.emit(value === true);
  }
}
