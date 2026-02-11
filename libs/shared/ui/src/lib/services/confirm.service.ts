import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  // Hàm này trả về Promise<boolean>
  // true: Nếu người dùng bấm "Đồng ý"
  // false: Nếu bấm "Hủy" hoặc bấm ra ngoài
  async confirm(
    title: string = 'Bạn có chắc không?',
    text: string = 'Hành động này không thể hoàn tác!',
    confirmButtonText: string = 'Xóa luôn',
    cancelButtonText: string = 'Thôi, hủy',
  ): Promise<boolean> {
    const result = await Swal.fire({
      title: title,
      text: text,
      icon: 'warning',

      showCancelButton: true,
      confirmButtonColor: '#d33', // Màu đỏ cho nút xóa
      cancelButtonColor: '#3085d6', // Màu xanh cho nút hủy

      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,

      // Hiệu ứng focus vào nút hủy (để đỡ lỡ tay bấm xóa)
      focusCancel: true,
    });

    return result.isConfirmed;
  }
}
