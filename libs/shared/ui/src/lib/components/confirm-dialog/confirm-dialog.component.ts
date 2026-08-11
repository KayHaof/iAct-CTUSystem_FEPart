import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../services/confirm.service';

export type ConfirmType = 'info' | 'success' | 'warning' | 'danger';

export interface ConfirmDialogConfig {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  onConfirm?: () => void;
  onCancel?: () => void;
}

let confirmDialogInstanceId = 0;

@Component({
  selector: 'lib-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  readonly confirmService = inject(ConfirmService);
  readonly dialogState = this.confirmService.dialogState;

  private readonly instanceId = ++confirmDialogInstanceId;
  readonly titleId = `iact-confirm-title-${this.instanceId}`;
  readonly messageId = `iact-confirm-message-${this.instanceId}`;

  typeLabel(type: ConfirmType): string {
    switch (type) {
      case 'success':
        return 'Xác nhận thao tác';
      case 'warning':
        return 'Cần kiểm tra';
      case 'danger':
        return 'Thao tác cần thận trọng';
      default:
        return 'Xác nhận thao tác';
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('confirm-overlay')) {
      this.onCancel();
    }
  }

  onCancel(): void {
    const state = this.dialogState();
    if (state?.onCancel) {
      state.onCancel();
    }
    this.confirmService.cancel();
  }

  onConfirm(): void {
    const state = this.dialogState();
    if (state?.onConfirm) {
      state.onConfirm();
    }
    this.confirmService.confirmAction();
  }
}
