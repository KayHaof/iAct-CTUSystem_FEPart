import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { UserService } from '@my-mfe/auth';
import { CloudinaryService } from '@my-mfe/data-access-media';
import { AlertService, ConfirmService } from '@my-mfe/ui';
import { OAuthService } from 'angular-oauth2-oidc';

import { of, Observable } from 'rxjs';
import { switchMap, finalize } from 'rxjs/operators';

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
  private alertService = inject(AlertService);
  private oauthService = inject(OAuthService);
  private confirmService = inject(ConfirmService);

  defaultAvatar =
    'https://res.cloudinary.com/dhjamvg6j/image/upload/v1770104643/b8erttd8eughls55igvb.jpg';

  user = computed(() => this.userService.currentUser());
  isEditing = signal(false);
  isUploading = signal(false);

  previewAvatar = signal<string | null>(null);
  selectedFile: File | null = null;

  profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    birthday: [''],
    gender: [null as number | null],
    phone: ['', [Validators.pattern(/(84|0[3|5|7|8|9])+([0-9]{8})\b/)]],
    address: [''],
    avatarUrl: [''],
  });

  enterEditMode() {
    const u = this.user();
    if (u) {
      this.isEditing.set(true);

      this.profileForm.patchValue({
        fullName: u.fullName,
        birthday: u.birthday ? new Date(u.birthday).toISOString().split('T')[0] : '',
        gender: u.gender,
        phone: u.phone,
        address: u.address,
        avatarUrl: u.avatarUrl,
      });

      this.previewAvatar.set(null);
      this.selectedFile = null;
    }
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.profileForm.reset();
    this.selectedFile = null;
    this.previewAvatar.set(null);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.alertService.error('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => this.previewAvatar.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  saveInfo() {
    if (this.profileForm.invalid) {
      this.alertService.error('Vui lòng kiểm tra lại các trường thông tin!');
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
          const currentUser = this.user();
          if (!currentUser || !currentUser.id) {
            throw new Error('Không tìm thấy ID người dùng!');
          }

          // 1. Xử lý logic gán URL ảnh
          if (newImageUrl) {
            console.log('Đã upload ảnh mới:', newImageUrl);
            formData.avatarUrl = newImageUrl;
          } else {
            // Lấy lại ảnh cũ nếu không đổi ảnh
            formData.avatarUrl = currentUser.avatarUrl;
          }

          // 2. Gọi API cập nhật
          return this.userService.updateProfile(currentUser.id, formData);
        }),
        this.alertService.observe(
          'Cập nhật hồ sơ thành công!',
          'Cập nhật thất bại, vui lòng thử lại!',
        ),
        finalize(() => this.isUploading.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.isEditing.set(false);

          // 3. Cập nhật State nội bộ
          this.userService.currentUser.update((oldUser) => {
            if (!oldUser) return oldUser;
            return { ...oldUser, ...formData };
          });
        },
        error: (err) => {
          console.error('Chi tiết lỗi:', err);
        },
      });
  }

  changePassword() {
    this.oauthService.initLoginFlow('', { kc_action: 'UPDATE_PASSWORD', prompt: 'login' });
  }

  async confirmDeactivate() {
    const isConfirmed = await this.confirmService.confirm(
      'Vô hiệu hóa tài khoản?',
      'Bạn sẽ bị đăng xuất và không thể tự đăng nhập lại cho đến khi Admin mở khóa!',
      'Vô hiệu hóa ngay',
      'Để tôi suy nghĩ lại',
    );

    if (isConfirmed) {
      const currentUser = this.user();
      if (!currentUser || !currentUser.id) return;

      this.userService.deactivateAccount(currentUser.id).subscribe({
        next: (res) => {
          this.alertService.success(res.message || 'Tài khoản đã được vô hiệu hóa!');
          this.oauthService.logOut();
        },
        error: (err) => {
          console.error('Lỗi vô hiệu hóa:', err);
          const msg = err.error?.message || 'Có lỗi xảy ra, không thể thực hiện.';
          this.alertService.error(msg);
        },
      });
    }
  }
}
