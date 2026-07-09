import { Injectable, signal } from '@angular/core';
import { ConfirmDialogConfig } from '../components/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private _dialogState = signal<ConfirmDialogConfig | null>(null);
  dialogState = this._dialogState.asReadonly();

  private resolvePromise: (() => void) | null = null;
  private rejectPromise: (() => void) | null = null;

  confirm(config: ConfirmDialogConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this._dialogState.set({
        ...config,
        type: config.type || 'info',
        onConfirm: () => {
          config.onConfirm?.();
          resolve();
        },
        onCancel: () => {
          config.onCancel?.();
          reject();
        }
      });
      this.resolvePromise = resolve;
      this.rejectPromise = reject;
    });
  }

  success(config: Omit<ConfirmDialogConfig, 'type'>): Promise<void> {
    return this.confirm({ ...config, type: 'success' });
  }

  warning(config: Omit<ConfirmDialogConfig, 'type'>): Promise<void> {
    return this.confirm({ ...config, type: 'warning' });
  }

  danger(config: Omit<ConfirmDialogConfig, 'type'>): Promise<void> {
    return this.confirm({ ...config, type: 'danger' });
  }

  info(config: Omit<ConfirmDialogConfig, 'type'>): Promise<void> {
    return this.confirm({ ...config, type: 'info' });
  }

  confirmAction(): void {
    if (this.resolvePromise) {
      this.resolvePromise();
    }
    this._dialogState.set(null);
  }

  cancel(): void {
    if (this.rejectPromise) {
      this.rejectPromise();
    }
    this._dialogState.set(null);
    this.resolvePromise = null;
    this.rejectPromise = null;
  }

  isOpen(): boolean {
    return this._dialogState() !== null;
  }
}
