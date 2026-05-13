import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminUserService } from '../../services/admin-user.service';
import { ApiResponse, MajorInfo, ClassInfo, Department } from 'interface';

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.scss'],
})
export class AddUserModalComponent {
  private adminUserService = inject(AdminUserService);

  @Input() departments: Department[] = [];

  private _isOpen = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() saveUser = new EventEmitter<any>();

  // --- STATE CỦA COMPONENT CON ---
  isSaving = signal(false);
  addMajors = signal<MajorInfo[]>([]);
  addClasses = signal<ClassInfo[]>([]);

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  confirmPassword = '';

  @Input()
  set isOpen(value: boolean) {
    this._isOpen = value;
    if (!value) {
      this.resetForm();
      this.isSaving.set(false);
    }
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  newUser = {
    username: '',
    email: '',
    roleType: 0,
    password: '',
    studentCode: '',
    fullName: '',
    description: '',
    departmentId: null as number | null,
    majorId: null as number | null,
    classId: null as number | null,
  };

  // --- LOGIC ĐIỀU KHIỂN ---
  close() {
    this.closeModal.emit();
    this.resetForm();
  }

  resetForm() {
    this.newUser = {
      username: '',
      email: '',
      roleType: 0,
      password: '',
      studentCode: '',
      fullName: '',
      description: '',
      departmentId: null,
      majorId: null,
      classId: null,
    };
    this.confirmPassword = '';
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);
    this.addMajors.set([]);
    this.addClasses.set([]);
  }

  onRoleChange() {
    this.newUser.roleType = Number(this.newUser.roleType);

    this.newUser.studentCode = '';
    this.newUser.fullName = '';
    this.newUser.description = '';
    this.newUser.departmentId = null;
    this.newUser.majorId = null;
    this.newUser.classId = null;
    this.addMajors.set([]);
    this.addClasses.set([]);
  }

  onAddDeptChange() {
    this.newUser.majorId = null;
    this.newUser.classId = null;
    this.addClasses.set([]);

    if (!this.newUser.departmentId) {
      this.addMajors.set([]);
      return;
    }

    this.adminUserService.getMajorsByDepartment(this.newUser.departmentId).subscribe({
      next: (res: ApiResponse<MajorInfo[]>) => {
        if (res && res.result) {
          const safeResult = res.result as unknown as MajorInfo[] | { data?: MajorInfo[] };
          const majorList = Array.isArray(safeResult) ? safeResult : safeResult.data;
          this.addMajors.set(majorList || []);
        }
      },
      error: (err) => console.error('Lỗi khi lấy danh sách chuyên ngành:', err),
    });
  }

  onAddMajorChange() {
    this.newUser.classId = null;

    if (!this.newUser.majorId) {
      this.addClasses.set([]);
      return;
    }

    this.adminUserService.getClassesByMajor(this.newUser.majorId).subscribe({
      next: (res: ApiResponse<ClassInfo[]>) => {
        if (res && res.result) {
          const safeResult = res.result as unknown as ClassInfo[] | { data?: ClassInfo[] };
          const classList = Array.isArray(safeResult) ? safeResult : safeResult.data;
          this.addClasses.set(classList || []);
        }
      },
      error: (err) => console.error('Lỗi khi lấy danh sách lớp:', err),
    });
  }

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  isFormValid(): boolean {
    if (
      !this.newUser.username ||
      !this.newUser.email ||
      !this.newUser.password ||
      !this.confirmPassword ||
      this.newUser.password !== this.confirmPassword ||
      this.newUser.roleType === 0
    )
      return false;

    if (this.newUser.roleType === 1) return !!(this.newUser.studentCode && this.newUser.fullName);
    return !!this.newUser.fullName;
  }

  submit() {
    if (!this.isFormValid()) return;
    this.isSaving.set(true);
    this.saveUser.emit(this.newUser);
  }
}
