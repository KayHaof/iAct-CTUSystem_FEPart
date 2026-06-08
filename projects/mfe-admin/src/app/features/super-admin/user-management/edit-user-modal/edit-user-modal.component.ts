import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse, ClassInfo, Department, MajorInfo, UserInfo } from 'interface';
import { AdminUserService } from '../../services/admin-user.service';

@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-user-modal.component.html',
  styleUrls: ['./edit-user-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditUserModalComponent {
  private adminUserService = inject(AdminUserService);

  private _isOpen = false;

  @Input()
  set isOpen(value: boolean) {
    this._isOpen = value;
    if (!value) this.resetForm();
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() user: UserInfo | null = null;
  @Input() departments: Department[] = [];
  @Input() isSaving = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() saveClass = new EventEmitter<number>();

  majors = signal<MajorInfo[]>([]);
  classesForEdit = signal<ClassInfo[]>([]);

  editSelectedDept = signal<number | ''>('');
  editSelectedMajor = signal<number | ''>('');
  editSelectedClass = signal<number | ''>('');

  close() {
    this.closeModal.emit();
  }

  resetForm() {
    this.editSelectedDept.set('');
    this.editSelectedMajor.set('');
    this.editSelectedClass.set('');
    this.majors.set([]);
    this.classesForEdit.set([]);
  }

  onEditDeptChange() {
    const deptId = this.editSelectedDept();
    this.editSelectedMajor.set('');
    this.editSelectedClass.set('');
    this.classesForEdit.set([]);

    if (!deptId) {
      this.majors.set([]);
      return;
    }

    this.adminUserService.getMajorsByDepartment(Number(deptId)).subscribe({
      next: (res: ApiResponse<MajorInfo[]>) => {
        const result = res.data as unknown as MajorInfo[] | { data?: MajorInfo[] };
        this.majors.set(Array.isArray(result) ? result : result?.data || []);
      },
      error: () => this.majors.set([]),
    });
  }

  onEditMajorChange() {
    const majorId = this.editSelectedMajor();
    this.editSelectedClass.set('');

    if (!majorId) {
      this.classesForEdit.set([]);
      return;
    }

    this.adminUserService.getClassesByMajor(Number(majorId)).subscribe({
      next: (res: ApiResponse<ClassInfo[]>) => {
        const result = res.data as unknown as ClassInfo[] | { data?: ClassInfo[] };
        this.classesForEdit.set(Array.isArray(result) ? result : result?.data || []);
      },
      error: () => this.classesForEdit.set([]),
    });
  }

  submit() {
    const classId = this.editSelectedClass();
    if (!classId) return;
    this.saveClass.emit(Number(classId));
  }
}
