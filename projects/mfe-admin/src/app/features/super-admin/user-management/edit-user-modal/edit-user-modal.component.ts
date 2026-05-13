import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserInfo, Department, MajorInfo, ClassInfo, ApiResponse } from 'interface';
import { AdminUserService } from '../../services/admin-user.service'; // Chỉnh đường dẫn cho đúng nha

@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-user-modal.component.html',
  styleUrls: ['./edit-user-modal.component.scss']
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

    if (!deptId) return;

    this.adminUserService.getMajorsByDepartment(Number(deptId)).subscribe({
      next: (res: ApiResponse<MajorInfo[]>) => {
        if (res && res.result) {
          const safeResult = res.result as unknown as MajorInfo[] | { data?: MajorInfo[] };
          const majorList = Array.isArray(safeResult) ? safeResult : safeResult.data;
          this.majors.set(majorList || []);
        }
      },
    });
  }

  onEditMajorChange() {
    const majorId = this.editSelectedMajor();
    this.editSelectedClass.set('');

    if (!majorId) return;

    this.adminUserService.getClassesByMajor(Number(majorId)).subscribe({
      next: (res: ApiResponse<ClassInfo[]>) => {
        if (res && res.result) {
          const safeResult = res.result as unknown as ClassInfo[] | { data?: ClassInfo[] };
          const classList = Array.isArray(safeResult) ? safeResult : safeResult.data;
          this.classesForEdit.set(classList || []);
        }
      },
    });
  }

  submit() {
    const classId = this.editSelectedClass();
    if (!classId) return;
    this.saveClass.emit(Number(classId));
  }
}
