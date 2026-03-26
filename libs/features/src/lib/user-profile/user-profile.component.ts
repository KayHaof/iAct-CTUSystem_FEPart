import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { UserService } from '@my-mfe/auth';
import { ApiResponse, UserInfo} from 'interface';
import { CloudinaryService } from '@my-mfe/data-access-media';
import { AlertService, ConfirmService } from '@my-mfe/ui';
import { OAuthService } from 'angular-oauth2-oidc';

import { of, Observable } from 'rxjs';
import { switchMap, finalize } from 'rxjs/operators';

import { HeaderComponent } from '@my-mfe/ui';

@Component({
  selector: 'lib-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
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
  private location = inject(Location);

  defaultAvatar =
    'https://res.cloudinary.com/dhjamvg6j/image/upload/v1772527220/0305-logo-ctu_vrk0rw.png';

  adminAvatar = 'https://res.cloudinary.com/dhjamvg6j/image/upload/v1773991699/iact_admin_avt.png';

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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.alertService.error('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.previewAvatar.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  saveInfo() {
    if (this.profileForm.invalid) {
      this.alertService.error('Vui lòng kiểm tra lại các trường thông tin!');
      return;
    }

    this.isUploading.set(true);

    const formValues = this.profileForm.value;

    const formData: Partial<UserInfo> = {
      fullName: formValues.fullName || undefined,
      birthday: formValues.birthday || undefined,
      gender: formValues.gender ?? undefined,
      phone: formValues.phone || undefined,
      address: formValues.address || undefined,
    };

    const uploadStream$: Observable<string | null> = this.selectedFile
      ? this.cloudinaryService.uploadImage(this.selectedFile, 'avatar')
      : of(null);

    uploadStream$
      .pipe(
        switchMap((newImageUrl: string | null) => {
          const currentUser = this.user();
          if (!currentUser || !currentUser.id) {
            throw new Error('Không tìm thấy ID người dùng!');
          }

          if (newImageUrl) {
            console.log('Đã upload ảnh mới:', newImageUrl);
            formData.avatarUrl = newImageUrl;
          } else {
            formData.avatarUrl = currentUser.avatarUrl;
          }

          return this.userService.updateProfile(currentUser.id, formData);
        }),
        this.alertService.observe(
          'Cập nhật hồ sơ thành công!',
          'Cập nhật thất bại, vui lòng thử lại!',
        ),
        finalize(() => this.isUploading.set(false)),
      )
      .subscribe({
        next: (res: ApiResponse<UserInfo>) => {
          this.isEditing.set(false);

          this.userService.currentUser.update((oldUser) => {
            if (!oldUser) return oldUser;
            return { ...oldUser, ...formData, ...res.result };
          });
        },
        error: (err: HttpErrorResponse) => {
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
        next: (res: ApiResponse<string>) => {
          this.alertService.success(res.message || 'Tài khoản đã được vô hiệu hóa!');
          this.oauthService.logOut();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Lỗi vô hiệu hóa:', err);
          const msg = err.error?.message || 'Có lỗi xảy ra, không thể thực hiện.';
          this.alertService.error(msg);
        },
      });
    }
  }

  goBack() {
    this.location.back();
  }
}
