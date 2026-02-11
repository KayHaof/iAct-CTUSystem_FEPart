import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { UserService } from '@my-mfe/auth';
// import { AlertService } from '@my-mfe/ui'; // Import service thông báo của ní

// Validator: So khớp mật khẩu
export const passwordMatchValidator = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('newPassword');
  const confirm = control.get('confirmPassword');
  return password && confirm && password.value !== confirm.value ? { mismatch: true } : null;
};

@Component({
  selector: 'lib-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent {
  // Services
  public userService = inject(UserService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  // private alertService = inject(AlertService); // Uncomment khi dùng thật

  // Config Cloudinary
  private readonly CLOUD_NAME = 'dhjamvg6j';
  private readonly UPLOAD_PRESET = 'ung_dung_cntt';

  defaultAvatar =
    'https://res.cloudinary.com/dhjamvg6j/image/upload/v1770104643/b8erttd8eughls55igvb.jpg';

  // State Signals
  user = computed(() => this.userService.currentUser());
  isEditing = signal(false);
  activeTab = signal<'info' | 'password'>('info');
  showPassword = signal(false);

  // Upload State
  previewAvatar = signal<string | null>(null);
  selectedFile: File | null = null;
  isUploading = signal(false);

  // --- FORM INFO ---
  profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    birthday: [''],
    gender: [null as number | null],
    phone: ['', [Validators.pattern(/(84|0[3|5|7|8|9])+([0-9]{8})\b/)]],
    address: [''],
  });

  // --- FORM PASSWORD ---
  passwordForm = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  // --- ACTIONS ---

  enterEditMode() {
    const u = this.user();
    if (u) {
      this.isEditing.set(true);
      this.activeTab.set('info');
      // Fill data
      this.profileForm.patchValue({
        fullName: u.fullName,
        birthday: u.birthday ? new Date(u.birthday).toISOString().split('T')[0] : '',
        gender: u.gender,
        phone: u.phone,
        address: u.address,
      });
      this.previewAvatar.set(null);
      this.selectedFile = null;
    }
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.profileForm.reset();
    this.passwordForm.reset();
    this.selectedFile = null;
    this.previewAvatar.set(null);
  }

  switchTab(tab: 'info' | 'password') {
    this.activeTab.set(tab);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // Limit 5MB
        alert('Ảnh quá lớn (Max 5MB)');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => this.previewAvatar.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  uploadToCloudinary(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.UPLOAD_PRESET);
    return this.http.post(
      `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`,
      formData,
    );
  }

  saveInfo() {
    if (this.profileForm.invalid) {
      // this.alertService.error('Vui lòng kiểm tra lại thông tin!');
      alert('Form chưa hợp lệ!');
      return;
    }

    this.isUploading.set(true);
    const formValue = this.profileForm.value;

    if (this.selectedFile) {
      this.uploadToCloudinary(this.selectedFile).subscribe({
        next: (res: any) => {
          this.callUpdateApi({ ...formValue, avtUrl: res.secure_url });
        },
        error: () => {
          this.isUploading.set(false);
          alert('Lỗi upload ảnh!');
        },
      });
    } else {
      this.callUpdateApi(formValue);
    }
  }

  callUpdateApi(data: any) {
    // Gọi API thật: this.userService.updateMyProfile(data)...
    console.log('Saving:', data);
    setTimeout(() => {
      this.isUploading.set(false);
      this.isEditing.set(false);
      // this.alertService.success('Cập nhật thành công!');
      alert('Cập nhật thành công! (Demo)');
    }, 1000);
  }

  changePassword() {
    if (this.passwordForm.invalid) return;
    console.log('Pass:', this.passwordForm.value);
    alert('Đổi mật khẩu thành công! (Demo)');
    this.isEditing.set(false);
  }

  toggleShowPassword() {
    this.showPassword.update((v) => !v);
  }
}
