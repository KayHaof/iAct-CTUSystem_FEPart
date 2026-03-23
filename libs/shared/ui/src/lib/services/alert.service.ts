import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, tap, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private snackBar = inject(MatSnackBar);

  success(message: string) {
    this.snackBar.open(message, 'Đóng', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  error(message: string) {
    this.snackBar.open(message, 'Đóng', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  warning(message: string) {
    this.snackBar.open(message, 'Đóng', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['warning-snackbar'],
    });
  }

  info(message: string) {
    this.snackBar.open(message, 'Đóng', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  observe<T>(messageSuccess: string, messageError: string) {
    return (source: Observable<T>) => {
      const loadingRef = this.snackBar.open('Đang xử lý...', '', {
        verticalPosition: 'top',
        horizontalPosition: 'right',
      });

      return source.pipe(
        tap(() => {
          loadingRef.dismiss();
          this.success(messageSuccess);
        }),
        catchError((err) => {
          loadingRef.dismiss();
          this.error(messageError);
          throw err;
        }),
      );
    };
  }
}
