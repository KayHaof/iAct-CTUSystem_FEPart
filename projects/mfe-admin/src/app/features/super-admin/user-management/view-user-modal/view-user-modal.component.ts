import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
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
})
export class ViewUserModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() user: UserInfo | null = null;
  @Output() closeModal = new EventEmitter<void>();

  private userService = inject(UserService);

  // ĐÃ SỬA: Thêm `| null` để khớp với giá trị khởi tạo
  displayUser: UserInfo | null = null;
  isLoading = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.user) {
      // 1. Lấy data cơ bản đắp lên giao diện ngay lập tức
      this.displayUser = { ...this.user };

      // 2. Đi fetch data chi tiết
      if (this.user.id) {
        this.fetchProfileDetails(this.user.id);
      }
    }
  }

  fetchProfileDetails(userId: number | string) {
    this.isLoading.set(true);
    this.userService.getFullProfile(userId).subscribe({
      next: (res) => {
        // ĐÃ SỬA: Phải check displayUser khác null trước khi trộn data
        if (res.result && this.displayUser) {
          this.displayUser = {
            ...this.displayUser,
            birthday: res.result.birthday,
            gender: res.result.gender,
            phone: res.result.phone,
            address: res.result.address,
            departmentName: res.result.departmentName || this.displayUser.departmentName,
            classCode: res.result.classCode || this.displayUser.classCode,
            studentCode: res.result.studentCode || this.displayUser.studentCode,
          };
        }
      },
      error: (err) => {
        console.error('Lấy chi tiết hồ sơ thất bại (Có thể user chưa có profile):', err);
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  close() {
    this.displayUser = null;
    this.closeModal.emit();
  }
}
