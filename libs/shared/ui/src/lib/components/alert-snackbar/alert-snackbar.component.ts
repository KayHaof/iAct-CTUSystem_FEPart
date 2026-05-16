import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export type AlertSnackbarVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';

export type AlertSnackbarData = {
  title: string;
  message: string;
  variant: AlertSnackbarVariant;
  dismissible: boolean;
};

@Component({
  selector: 'lib-alert-snackbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-snackbar.component.html',
  styleUrls: ['./alert-snackbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertSnackbarComponent {
  private readonly snackBarRef = inject(MatSnackBarRef<AlertSnackbarComponent>);
  public readonly data = inject<AlertSnackbarData>(MAT_SNACK_BAR_DATA);

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}
