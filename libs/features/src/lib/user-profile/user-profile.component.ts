import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

import { UserService } from '@my-mfe/auth';
import { CloudinaryService } from '@my-mfe/data-access-media';
// 👇 Import AlertService (kiểm tra lại đường dẫn lib của ní nhé)
import { AlertService } from '@my-mfe/ui';

import { of, Observable } from 'rxjs';
import { switchMap, finalize } from 'rxjs/operators';

// Validator
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
  public userService = inject(UserService);
  private fb = inject(FormBuilder);
  private cloudinaryService = inject(CloudinaryService);
  private alertService = inject(AlertService); // 👈 Inject Service Thông báo

  defaultAvatar =
    'https://res.cloudinary.com/dhjamvg6j/image/upload/v1770104643/b8erttd8eughls55igvb.jpg';

  user = computed(() => this.userService.currentUser());
  isEditing = signal(false);
  activeTab = signal<'info' | 'password'>('info');
  showPassword = signal(false);
  isUploading = signal(false);

  previewAvatar = signal<string | null>(null);
  selectedFile: File | null = null;

  profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    birthday: [''],
    gender: [null as number | null],
    phone: ['', [Validators.pattern(/(84|0[3|5|7|8|9])+([0-9]{8})\b/)]],
    address: [''],
    avtUrl: [''],
  });

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

      this.profileForm.patchValue({
        fullName: u.fullName,
        birthday: u.birthday ? new Date(u.birthday).toISOString().split('T')[0] : '',
        gender: u.gender,
        phone: u.phone,
        address: u.address,
        avtUrl: u.avtUrl,
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
        this.alertService.error('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.'); // 👈 Thông báo lỗi đẹp
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => this.previewAvatar.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  // ================= MAIN LOGIC: SAVE INFO (Dùng Observe) =================
  saveInfo() {
    if (this.profileForm.invalid) {
      this.alertService.error('Vui lòng kiểm tra lại các trường thông tin!'); // 👈 Thay alert thường
      return;
    }

    this.isUploading.set(true);

    const formData: any = { ...this.profileForm.value };

    const uploadStream$: Observable<any> = this.selectedFile
      ? this.cloudinaryService.uploadImage(this.selectedFile)
      : of(null);

    uploadStream$
      .pipe(
        switchMap((newImageUrl) => {
          if (newImageUrl) {
            console.log('📸 Đã upload ảnh mới:', newImageUrl);
            formData.avtUrl = newImageUrl;
          }

          const currentUser = this.user();
          if (!currentUser || !currentUser.id) {
            throw new Error('Không tìm thấy ID người dùng!');
          }

          return this.userService.updateProfile(currentUser.id, formData);
        }),
        // 🔥 MAGIC Ở ĐÂY: Tự động hiện Loading -> Success/Error
        this.alertService.observe(
          'Cập nhật hồ sơ thành công!',
          'Cập nhật thất bại, vui lòng thử lại!',
        ),

        finalize(() => this.isUploading.set(false)),
      )
      .subscribe({
        next: (res) => {
          // Không cần alert success nữa vì observe lo rồi
          this.isEditing.set(false);
          // this.userService.refreshUser();
        },
        error: (err) => {
          console.error('❌ Chi tiết lỗi:', err);
          // Không cần alert error nữa vì observe lo rồi
        },
      });
  }

  // ================= PASSWORD LOGIC =================
  changePassword() {
    if (this.passwordForm.invalid) {
      this.alertService.error('Mật khẩu nhập chưa đúng quy tắc!');
      return;
    }

    // Giả lập gọi API đổi pass
    console.log('Đổi mật khẩu:', this.passwordForm.value);

    // Thông báo thành công
    this.alertService.success('Đổi mật khẩu thành công!');

    this.isEditing.set(false);
    this.passwordForm.reset();
  }

  toggleShowPassword() {
    this.showPassword.update((v) => !v);
  }
}
