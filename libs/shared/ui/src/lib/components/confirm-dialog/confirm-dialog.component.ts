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

@Component({
  selector: 'lib-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (confirmService.dialogState()) {
      <div
        class="confirm-overlay"
        role="presentation"
        tabindex="-1"
        (click)="onOverlayClick($event)"
        (keydown.escape)="onCancel()"
      >
        <div class="confirm-card" [class]="'confirm-card--' + confirmService.dialogState()!.type">
          <div class="confirm-bar"></div>
          <div class="confirm-content">
            <h2 class="confirm-title">{{ confirmService.dialogState()!.title }}</h2>
            @if (confirmService.dialogState()!.message) {
              <p class="confirm-message">{{ confirmService.dialogState()!.message }}</p>
            }
            <div class="confirm-actions">
              <button type="button" class="btn btn-cancel" (click)="onCancel()">
                {{ confirmService.dialogState()!.cancelText || 'Huy bo' }}
              </button>
              <button
                type="button"
                class="btn btn-confirm"
                [class]="'btn-confirm--' + confirmService.dialogState()!.type"
                (click)="onConfirm()"
              >
                {{ confirmService.dialogState()!.confirmText || 'Xac nhan' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .confirm-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: var(--z-modal, 400);
        animation: fadeIn 0.2s ease;
        backdrop-filter: blur(4px);
      }

      .confirm-card {
        background: var(--bg, #ffffff);
        border-radius: var(--radius-2xl, 1rem);
        border: 1px solid var(--border, #e2e8f0);
        box-shadow: var(--shadow-xl, 0 25px 50px -12px rgba(0, 0, 0, 0.15));
        width: min(92vw, 460px);
        overflow: hidden;
        animation: slideUp 0.3s ease;
      }

      .confirm-bar {
        height: 5px;
        background: var(--gradient-primary);
      }

      .confirm-card--success .confirm-bar {
        background: var(--gradient-success);
      }

      .confirm-card--warning .confirm-bar {
        background: var(--gradient-warning);
      }

      .confirm-card--danger .confirm-bar {
        background: var(--gradient-danger);
      }

      .confirm-content {
        padding: 1.5rem 1.75rem 1.75rem;
      }

      .confirm-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--text, #0f172a);
        line-height: 1.3;
      }

      .confirm-message {
        margin: 0.625rem 0 0;
        color: var(--text-muted, #64748b);
        font-size: 0.9375rem;
        line-height: 1.6;
      }

      .confirm-actions {
        display: flex;
        gap: 0.625rem;
        margin-top: 1.5rem;
        justify-content: flex-end;
      }

      .btn {
        padding: 0.625rem 1.125rem;
        border-radius: var(--radius-lg, 0.5rem);
        font-weight: 700;
        font-size: 0.875rem;
        cursor: pointer;
        border: none;
        transition: all 0.18s ease;
      }

      .btn:hover {
        transform: translateY(-1px);
      }

      .btn-cancel {
        background: var(--bg-input, #f1f5f9);
        color: var(--text-secondary, #475569);

        &:hover {
          background: var(--border, #e2e8f0);
          color: var(--text, #0f172a);
        }
      }

      .btn-confirm {
        color: white;
        box-shadow: var(--shadow-primary);
        background: var(--gradient-primary);

        &--success {
          box-shadow: var(--shadow-success);
          background: var(--gradient-success);
        }

        &--warning {
          box-shadow: var(--shadow-warning);
          background: var(--gradient-warning);
        }

        &--danger {
          box-shadow: var(--shadow-danger);
          background: var(--gradient-danger);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  confirmService = inject(ConfirmService);

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('confirm-overlay')) {
      this.onCancel();
    }
  }

  onCancel(): void {
    const state = this.confirmService.dialogState();
    if (state?.onCancel) {
      state.onCancel();
    }
    this.confirmService.cancel();
  }

  onConfirm(): void {
    const state = this.confirmService.dialogState();
    if (state?.onConfirm) {
      state.onConfirm();
    }
    this.confirmService.confirmAction();
  }
}
