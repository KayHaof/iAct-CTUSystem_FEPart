import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome-banner.component.html',
  styleUrl: './welcome-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeBannerComponent {
  // Input nhận nguyên xi dữ liệu từ cha truyền vào
  @Input() name = 'Bạn';
  @Input() studentCode = ''; // Đổi tên thành studentCode cho khớp API

  // Hàm này chỉ tính toán để hiển thị Avatar, KHÔNG sửa đổi biến this.name
  get avatarInitial(): string {
    return this.name ? this.name.split(' ').pop()?.charAt(0) || 'S' : 'S';
  }
}
