import { Injectable, inject } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private toast = inject(HotToastService);

  success(message: string) {
    this.toast.success(message, {
      duration: 3000,
      style: { border: '1px solid #713200', padding: '16px', color: '#713200' },
    });
  }

  error(message: string) {
    this.toast.error(message, { duration: 4000 });
  }

  info(message: string) {
    this.toast.info(message);
  }

  observe<T>(messageSuccess: string, messageError: string) {
    return this.toast.observe<T>({
      loading: 'Đang xử lý...',
      success: messageSuccess,
      error: messageError,
    });
  }
}
