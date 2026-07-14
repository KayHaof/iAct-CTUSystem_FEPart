import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, from } from 'rxjs';
import Swal from 'sweetalert2';

const ACCOUNT_LOCKED_CODE = 1009;

function getApiErrorCode(error: HttpErrorResponse): number | null {
  const body = error.error as { code?: unknown } | null;
  return typeof body?.code === 'number' ? body.code : null;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const oauthService = inject(OAuthService);
  const router = inject(Router);

  const isApiUrl = req.url.includes('localhost:8080') || req.url.includes('/api/');

  if (oauthService.hasValidAccessToken() && isApiUrl) {
    const token = oauthService.getAccessToken();
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isApiUrl) {
        return from(oauthService.refreshToken()).pipe(
          switchMap(() => {
            const newToken = oauthService.getAccessToken();
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            return next(newReq);
          }),
          catchError((refreshError) => {
            oauthService.logOut();
            oauthService.initLoginFlow();
            return throwError(() => refreshError);
          }),
        );
      }

      if (error.status === 403 && isApiUrl && getApiErrorCode(error) === ACCOUNT_LOCKED_CODE) {
        oauthService.logOut();

        Swal.fire({
          icon: 'error',
          title: 'Tài khoản bị khóa',
          text: 'Tài khoản của bạn đã bị vô hiệu hóa. Hệ thống sẽ đăng xuất sau 5 giây.',
          timer: 5000,
          timerProgressBar: true,
          confirmButtonText: 'Đăng xuất ngay',
          confirmButtonColor: '#ef4444',
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          router.navigate(['/']).then(() => {
            window.location.reload();
          });
        });
      }

      return throwError(() => error);
    }),
  );
};
