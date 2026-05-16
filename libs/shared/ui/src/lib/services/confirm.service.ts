import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'primary' | 'info' | 'success';

export type ConfirmDialogOptions = {
  title: string;
  message?: string;
  html?: string;
  variant?: ConfirmDialogVariant;
  confirmText?: string;
  cancelText?: string;
  focusCancel?: boolean;
  reverseButtons?: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  async confirm(
    title = 'Bạn có chắc không?',
    text = 'Hành động này không thể hoàn tác!',
    confirmButtonText = 'Xác nhận',
    cancelButtonText = 'Hủy',
  ): Promise<boolean> {
    return this.confirmAction({
      title,
      message: text,
      variant: 'danger',
      confirmText: confirmButtonText,
      cancelText: cancelButtonText,
    });
  }

  async confirmAction(options: ConfirmDialogOptions): Promise<boolean> {
    const result = await Swal.fire(this.buildConfig(options));
    return result.isConfirmed;
  }

  danger(title: string, message: string, confirmText = 'Xác nhận'): Promise<boolean> {
    return this.confirmAction({
      title,
      message,
      confirmText,
      variant: 'danger',
    });
  }

  warning(title: string, message: string, confirmText = 'Tiếp tục'): Promise<boolean> {
    return this.confirmAction({
      title,
      message,
      confirmText,
      variant: 'warning',
    });
  }

  info(title: string, message: string, confirmText = 'Đồng ý'): Promise<boolean> {
    return this.confirmAction({
      title,
      message,
      confirmText,
      variant: 'info',
      focusCancel: false,
    });
  }

  private buildConfig(options: ConfirmDialogOptions): SweetAlertOptions {
    const variant = options.variant || 'primary';
    const icon = this.getIcon(variant);

    return {
      title: options.title,
      text: options.html ? undefined : options.message,
      html: options.html,
      icon,
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: options.confirmText || 'Xác nhận',
      cancelButtonText: options.cancelText || 'Hủy',
      focusCancel: options.focusCancel ?? variant === 'danger',
      reverseButtons: options.reverseButtons ?? true,
      customClass: {
        popup: `iact-confirm-popup iact-confirm-popup-${variant}`,
        title: 'iact-confirm-title',
        htmlContainer: 'iact-confirm-html',
        actions: 'iact-confirm-actions',
        confirmButton: `iact-confirm-button iact-confirm-${variant}`,
        cancelButton: 'iact-cancel-button',
      },
    };
  }

  private getIcon(variant: ConfirmDialogVariant): SweetAlertIcon {
    if (variant === 'danger') {
      return 'warning';
    }

    if (variant === 'primary') {
      return 'question';
    }

    return variant;
  }
}
