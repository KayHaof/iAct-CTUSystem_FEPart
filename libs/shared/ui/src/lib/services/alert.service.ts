import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Observable, catchError, tap, throwError } from 'rxjs';

import {
  AlertSnackbarComponent,
  AlertSnackbarData,
  AlertSnackbarVariant,
} from '../components/alert-snackbar/alert-snackbar.component';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open('success', 'Thành công', message, 3000);
  }

  error(message: string): void {
    this.open('error', 'Lỗi', message, 4500);
  }

  warning(message: string): void {
    this.open('warning', 'Cảnh báo', message, 4000);
  }

  info(message: string): void {
    this.open('info', 'Thông tin', message, 3000);
  }

  observe<T>(messageSuccess: string, messageError: string) {
    return (source: Observable<T>) => {
      const loadingRef = this.open(
        'loading',
        'Đang xử lý',
        'Vui lòng chờ trong giây lát.',
        undefined,
        false,
      );

      return source.pipe(
        tap(() => {
          loadingRef.dismiss();
          this.success(messageSuccess);
        }),
        catchError((err) => {
          loadingRef.dismiss();
          this.error(messageError);
          return throwError(() => err);
        }),
      );
    };
  }

  private open(
    variant: AlertSnackbarVariant,
    title: string,
    message: string,
    duration?: number,
    dismissible = true,
  ) {
    const data: AlertSnackbarData = {
      title,
      message,
      variant,
      dismissible,
    };

    const config: MatSnackBarConfig<AlertSnackbarData> = {
      data,
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['iact-alert-snackbar', `iact-alert-${variant}`],
    };

    return this.snackBar.openFromComponent(AlertSnackbarComponent, config);
  }
}
