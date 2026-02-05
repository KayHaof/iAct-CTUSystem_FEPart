import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { catchError, throwError, switchMap, from } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const oauthService = inject(OAuthService);

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
            oauthService.initLoginFlow();
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
