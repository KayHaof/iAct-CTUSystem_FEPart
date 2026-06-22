import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  computed,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { UserService } from '@my-mfe/auth';
import { ApiResponse, UserInfo } from '@my-mfe/interface';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent implements OnInit {
  public userService = inject(UserService);
  private fb = inject(FormBuilder);
  private cloudinaryService = inject(CloudinaryService);
  private alertService = inject(AlertService);
  private oauthService = inject(OAuthService);
  private confirmService = inject(ConfirmService);
  private location = inject(Location);
  private elementRef = inject(ElementRef<HTMLElement>);

  defaultAvatar =
    'https://res.cloudinary.com/dhjamvg6j/image/upload/v1772527220/0305-logo-ctu_vrk0rw.png';
  adminAvatar = 'https://res.cloudinary.com/dhjamvg6j/image/upload/v1773991699/iact_admin_avt.png';

  user = computed(() => this.userService.currentUser());

  // [ĐÃ SỬA]: Thay <any> bằng <UserInfo | null>
  fullProfileData = signal<UserInfo | null>(null);

  isEditing = signal(false);
  isUploading = signal(false);
  isGenderDropdownOpen = signal(false);

  previewAvatar = signal<string | null>(null);
  selectedFile: File | null = null;

  genderOptions = [
    { value: 1, label: 'Nam' },
    { value: 0, label: 'Nữ' },
    { value: 2, label: 'Khác' },
  ];

  selectedGenderLabel = computed(() => {
    const currentGender = this.profileForm.get('gender')?.value;
    return (
      this.genderOptions.find((option) => option.value === currentGender)?.label || 'Chọn giới tính'
    );
  });

  profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    birthday: [''],
    gender: [null as number | null],
    phone: ['', [Validators.pattern(/^(84|0[35789])[0-9]{8,9}$/)]],
    address: [''],
    avatarUrl: [''],
  });

  ngOnInit(): void {
    const u = this.user();
    if (u && u.id) {
      this.loadFullProfile(u.id);
    }
  }

  @HostListener('document:click', ['$event'])
  closeGenderDropdownOnOutsideClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isGenderDropdownOpen.set(false);
    }
  }

  loadFullProfile(userId: number | string) {
    this.userService.getFullProfile(userId).subscribe({
      next: (res) => {
        if (res.data) {
          this.fullProfileData.set(res.data);
        }
      },
      error: (err) => console.error('Không thể tải chi tiết hồ sơ:', err),
    });
  }

  enterEditMode() {
    const fullData = this.fullProfileData();
    if (fullData) {
      this.isEditing.set(true);
      this.profileForm.patchValue({
        fullName: fullData.fullName,
        birthday: fullData.birthday ? new Date(fullData.birthday).toISOString().split('T')[0] : '',
        gender: fullData.gender,
        phone: fullData.phone,
        address: fullData.address,
        avatarUrl: fullData.avatarUrl,
      });

      this.previewAvatar.set(null);
      this.selectedFile = null;
    } else {
      const u = this.user();
      if (u) {
        this.isEditing.set(true);
        this.profileForm.patchValue({ fullName: u.fullName, avatarUrl: u.avatarUrl });
      }
    }
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.profileForm.reset();
    this.selectedFile = null;
    this.previewAvatar.set(null);
    this.isGenderDropdownOpen.set(false);
  }

  toggleGenderDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.isGenderDropdownOpen.update((isOpen) => !isOpen);
  }

  selectGender(value: number) {
    this.profileForm.get('gender')?.setValue(value);
    this.profileForm.get('gender')?.markAsDirty();
    this.profileForm.get('gender')?.markAsTouched();
    this.isGenderDropdownOpen.set(false);
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
      fullName: formValues.fullName ?? undefined,
      birthday: formValues.birthday ?? undefined,
      gender: formValues.gender ?? undefined,
      phone: formValues.phone ?? undefined,
      address: formValues.address ?? undefined,
    };

    const uploadStream$: Observable<string | null> = this.selectedFile
      ? this.cloudinaryService.uploadImage(this.selectedFile, 'avatar')
      : of(null);

    uploadStream$
      .pipe(
        switchMap((newImageUrl: string | null) => {
          const currentUser = this.user();
          if (!currentUser || !currentUser.id) throw new Error('Không tìm thấy ID người dùng!');

          if (newImageUrl) {
            formData.avatarUrl = newImageUrl;
          } else {
            const fullData = this.fullProfileData();
            formData.avatarUrl = fullData?.avatarUrl ? fullData.avatarUrl : currentUser.avatarUrl;
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
        next: () => {
          this.isEditing.set(false);

          const u = this.user();
          if (u && u.id) {
            this.loadFullProfile(u.id);
            this.userService.currentUser.update((oldUser) => {
              if (!oldUser) return oldUser;
              return {
                ...oldUser,
                fullName: formData.fullName !== undefined ? formData.fullName : oldUser.fullName,
                avatarUrl:
                  formData.avatarUrl !== undefined ? formData.avatarUrl : oldUser.avatarUrl,
              };
            });

            this.alertService.success('Cập nhật hồ sơ thành công!');
          }
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
    await this.confirmService.confirm({
      title: 'Vô hiệu hóa tài khoản?',
      message: 'Bạn sẽ bị đăng xuất và không thể tự đăng nhập lại cho đến khi Admin mở khóa!',
      confirmText: 'Vô hiệu hóa ngay',
      cancelText: 'Để tôi suy nghĩ lại',
      type: 'danger',
      onConfirm: () => {
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
      },
    });
  }

  goBack() {
    this.location.back();
  }
}
