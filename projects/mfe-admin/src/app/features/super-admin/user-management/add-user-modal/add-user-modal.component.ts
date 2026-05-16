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

import { AdminUserService } from '../../services/admin-user.service';
import { ApiResponse, ClassInfo, Department, MajorInfo } from 'interface';

export interface NewUserForm {
  username: string;
  email: string;
  roleType: number;
  password: string;
  studentCode: string;
  fullName: string;
  description: string;
  departmentId: number | null;
  majorId: number | null;
  classId: number | null;
}

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddUserModalComponent {
  private adminUserService = inject(AdminUserService);

  @Input() departments: Department[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveUser = new EventEmitter<NewUserForm>();

  private _isOpen = false;

  isSaving = signal(false);
  addMajors = signal<MajorInfo[]>([]);
  addClasses = signal<ClassInfo[]>([]);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  confirmPassword = '';

  newUser: NewUserForm = this.createEmptyUser();

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

  close() {
    this.closeModal.emit();
    this.resetForm();
  }

  resetForm() {
    this.newUser = this.createEmptyUser();
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
        const result = res.result as unknown as MajorInfo[] | { data?: MajorInfo[] };
        this.addMajors.set(Array.isArray(result) ? result : result?.data || []);
      },
      error: () => this.addMajors.set([]),
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
        const result = res.result as unknown as ClassInfo[] | { data?: ClassInfo[] };
        this.addClasses.set(Array.isArray(result) ? result : result?.data || []);
      },
      error: () => this.addClasses.set([]),
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
      !this.newUser.username.trim() ||
      !this.newUser.email.trim() ||
      !this.newUser.password ||
      !this.confirmPassword ||
      this.newUser.password !== this.confirmPassword ||
      this.newUser.roleType === 0
    ) {
      return false;
    }

    if (this.newUser.roleType === 1) {
      return !!(this.newUser.studentCode.trim() && this.newUser.fullName.trim());
    }

    return !!this.newUser.fullName.trim();
  }

  submit() {
    if (!this.isFormValid()) return;
    this.isSaving.set(true);
    this.saveUser.emit(this.newUser);
  }

  private createEmptyUser(): NewUserForm {
    return {
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
  }
}
