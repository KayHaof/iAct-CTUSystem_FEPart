import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface AdminFormData {
  username: string;
  email: string;
  fullName: string;
  password: string;
  description?: string;
}

@Component({
  selector: 'app-add-admin-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-admin-modal.component.html',
  styleUrls: ['./add-admin-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAdminModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveAdmin = new EventEmitter<AdminFormData>();

  private _isOpen = false;

  isSaving = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  confirmPassword = '';

  adminData: AdminFormData = this.createEmpty();

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
    this.adminData = this.createEmpty();
    this.confirmPassword = '';
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  isFormValid(): boolean {
    if (
      !this.adminData.username.trim() ||
      !this.adminData.email.trim() ||
      !this.adminData.fullName.trim() ||
      !this.adminData.password ||
      !this.confirmPassword
    ) {
      return false;
    }
    if (this.adminData.password !== this.confirmPassword) {
      return false;
    }
    if (this.adminData.password.length < 8) {
      return false;
    }
    return true;
  }

  passwordStrength(): 'weak' | 'medium' | 'strong' | null {
    const pwd = this.adminData.password;
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
    if (!this.isFormValid()) return;
    this.isSaving.set(true);
    this.saveAdmin.emit({
      ...this.adminData,
      description: this.adminData.description?.trim() || undefined,
    });
  }

  private createEmpty(): AdminFormData {
    return {
      username: '',
      email: '',
      fullName: '',
      password: '',
      description: '',
    };
  }
}
