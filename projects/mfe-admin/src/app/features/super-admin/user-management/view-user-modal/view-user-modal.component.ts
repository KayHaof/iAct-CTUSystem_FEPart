import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInfo } from 'interface';
import { UserService } from '@my-mfe/auth';

@Component({
  selector: 'app-view-user-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-user-modal.component.html',
  styleUrls: ['./view-user-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewUserModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() user: UserInfo | null = null;
  @Output() closeModal = new EventEmitter<void>();

  private userService = inject(UserService);

  displayUser = signal<UserInfo | null>(null);
  isLoading = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.user) {
      this.displayUser.set({ ...this.user });
      this.fetchProfileDetails(this.user.id);
    }
  }

  fetchProfileDetails(userId: number | string) {
    this.isLoading.set(true);
    this.userService.getFullProfile(userId).subscribe({
      next: (res) => {
        const current = this.displayUser();
        if (res.result && current) {
          this.displayUser.set({
            ...current,
            birthday: res.result.birthday,
            gender: res.result.gender,
            phone: res.result.phone,
            address: res.result.address,
            departmentName: res.result.departmentName || current.departmentName,
            classCode: res.result.classCode || current.classCode,
            studentCode: res.result.studentCode || current.studentCode,
          });
        }
      },
      error: () => this.isLoading.set(false),
      complete: () => this.isLoading.set(false),
    });
  }

  close() {
    this.displayUser.set(null);
    this.closeModal.emit();
  }

  roleLabel(roleType?: number) {
    if (roleType === 1) return 'Sinh viên';
    if (roleType === 2) return 'Khoa / đơn vị';
    if (roleType === 3) return 'Quản trị viên';
    return 'Khác';
  }

  genderLabel(gender?: number) {
    if (gender === 1) return 'Nam';
    if (gender === 0) return 'Nữ';
    if (gender === 2) return 'Khác';
    return 'Chưa cập nhật';
  }

  isActive(user: UserInfo | null) {
    return user?.status === 1;
  }
}
