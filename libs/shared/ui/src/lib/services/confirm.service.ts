import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  async confirm(
    title = 'Bạn có chắc không?',
    text = 'Hành động này không thể hoàn tác!',
    confirmButtonText = 'Xóa luôn',
    cancelButtonText = 'Thôi, hủy',
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
      focusCancel: true,
    });

    return result.isConfirmed;
  }
}
