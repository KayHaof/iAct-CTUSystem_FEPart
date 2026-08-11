import {
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminUserService } from '../../services/admin-user.service';
import { ApiResponse, ClassInfo, Department, MajorInfo } from '@my-mfe/interface';
import { CustomSelectComponent, CustomSelectOption, CustomSelectValue } from '@my-mfe/ui';

export interface NewStudentForm {
  username: string;
  email: string;
  password: string;
  studentCode: string;
  fullName: string;
  description?: string;
  roleType: number;
  departmentId: number | null;
  majorId: number | null;
  classId: number | null;
}

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AddUserModalComponent {
  private adminUserService = inject(AdminUserService);

  @Input() departments: Department[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveUser = new EventEmitter<NewStudentForm>();

  private _isOpen = false;

  @Input() isSaving = false;

  addMajors = signal<MajorInfo[]>([]);
  addClasses = signal<ClassInfo[]>([]);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  confirmPassword = '';

  readonly roleOptions: CustomSelectOption[] = [
    { label: 'Chọn vai trò', value: 0, icon: 'bi-person-badge' },
    { label: 'Sinh viên', value: 1, icon: 'bi-mortarboard' },
    { label: 'Khoa / đơn vị', value: 2, icon: 'bi-building' },
    { label: 'Quản trị viên', value: 3, icon: 'bi-shield-lock' },
  ];

  newUser: NewStudentForm = this.createEmptyUser();

  @Input()
  set isOpen(value: boolean) {
    this._isOpen = value;
    if (!value) {
      this.resetForm();
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
        const result = res.data as unknown as MajorInfo[] | { data?: MajorInfo[] };
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
        const result = res.data as unknown as ClassInfo[] | { data?: ClassInfo[] };
        this.addClasses.set(Array.isArray(result) ? result : result?.data || []);
      },
      error: () => this.addClasses.set([]),
    });
  }

  getDepartmentOptions(): CustomSelectOption[] {
    return [
      { label: 'Chọn trường / khoa', value: null, icon: 'bi-building' },
      ...this.departments.map((department) => ({
        label: department.name,
        value: department.id,
        icon: 'bi-building',
      })),
    ];
  }

  getMajorOptions(): CustomSelectOption[] {
    return [
      {
        label: 'Chọn chuyên ngành',
        value: null,
        icon: 'bi-mortarboard',
        disabled: !this.newUser.departmentId,
      },
      ...this.addMajors().map((major) => ({
        label: major.name,
        value: major.id,
        icon: 'bi-mortarboard',
        disabled: !this.newUser.departmentId,
      })),
    ];
  }

  getClassOptions(): CustomSelectOption[] {
    return [
      {
        label: 'Chọn lớp sinh hoạt',
        value: null,
        icon: 'bi-people',
        disabled: !this.newUser.majorId,
      },
      ...this.addClasses().map((cls) => ({
        label: cls.classCode || cls.name,
        value: cls.id,
        icon: 'bi-people',
        disabled: !this.newUser.majorId,
      })),
    ];
  }

  onRoleChange(value: CustomSelectValue): void {
    this.newUser.roleType = typeof value === 'number' ? value : 0;
  }

  onDepartmentSelected(value: CustomSelectValue): void {
    this.newUser.departmentId = typeof value === 'number' ? value : null;
    this.onAddDeptChange();
  }

  onMajorSelected(value: CustomSelectValue): void {
    this.newUser.majorId = typeof value === 'number' ? value : null;
    this.onAddMajorChange();
  }

  onClassSelected(value: CustomSelectValue): void {
    this.newUser.classId = typeof value === 'number' ? value : null;
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
      !this.newUser.roleType
    ) {
      return false;
    }
    return !!(this.newUser.studentCode.trim() && this.newUser.fullName.trim());
  }

  passwordStrength(): 'weak' | 'medium' | 'strong' | null {
    const pwd = this.newUser.password;
    if (!pwd) return null;
    if (pwd.length < 8) return 'weak';
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    const score = [hasUpper, hasLower, hasDigit].filter(Boolean).length;
    if (score >= 3) return 'strong';
    if (score >= 2) return 'medium';
    return 'weak';
  }

  submit() {
    if (!this.isFormValid() || this.isSaving) return;
    this.saveUser.emit({ ...this.newUser });
  }

  private createEmptyUser(): NewStudentForm {
    return {
      username: '',
      email: '',
      password: '',
      studentCode: '',
      fullName: '',
      description: '',
      roleType: 0,
      departmentId: null,
      majorId: null,
      classId: null,
    };
  }
}
