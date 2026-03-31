import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const serverErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        if (error.status >= 500 || error.status === 0) {
          console.error('=> Server toang rồi! Đang chuyển hướng...', error.message);

          void router.navigate(['/server-error'], {
            state: { error: error.error || 'Connection Refused' },
          });
        } else if (error.status === 404) {
          void router.navigate(['/not-found']);
        }
      }
      return throwError(() => error);
    }),
  );
};
