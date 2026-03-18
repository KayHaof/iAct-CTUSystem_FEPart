import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, from } from 'rxjs';
import Swal from 'sweetalert2';

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
      // TRƯỜNG HỢP 1: 401 Unauthorized (Token hết hạn)
      if (error.status === 401 && isApiUrl) {
        console.warn('Access Token hết hạn, đang thử Refresh Token...');

        return from(oauthService.refreshToken()).pipe(
          switchMap(() => {
            console.log('Refresh thành công! Đang gọi lại API...');
            const newToken = oauthService.getAccessToken();
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            return next(newReq);
          }),
          catchError((refreshError) => {
            console.error('Refresh Token cũng toang rồi. Login lại đi!');
            oauthService.logOut();
            oauthService.initLoginFlow();
            return throwError(() => refreshError);
          }),
        );
      }

      // TRƯỜNG HỢP 2: 403 Forbidden (Bị khóa tài khoản)
      if (error.status === 403 && isApiUrl) {
        console.error('Lỗi 403: Tài khoản bị khóa hoặc bị cấm truy cập!');

        // 1. Clear sạch sẽ trước để đảm bảo an toàn
        oauthService.logOut();
        sessionStorage.clear();
        localStorage.clear();

        // 2. Hiện cảnh báo có thanh đếm ngược 5 giây
        Swal.fire({
          icon: 'error',
          title: 'Truy cập bị từ chối',
          text: 'Tài khoản của bạn đã bị vô hiệu hóa. Hệ thống sẽ đăng xuất sau 5 giây...',
          timer: 5000,
          timerProgressBar: true,
          confirmButtonText: 'Đăng xuất ngay',
          confirmButtonColor: '#ef4444',
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then((result) => {
          router.navigate(['/']).then(() => {
            window.location.reload();
          });
        });
      }

      return throwError(() => error);
    }),
  );
};
