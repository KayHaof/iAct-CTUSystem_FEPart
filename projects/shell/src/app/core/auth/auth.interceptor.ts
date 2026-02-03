import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const oauthService = inject(OAuthService);

  const isApiUrl = req.url.includes('localhost:8080') || req.url.includes('/api/');

  if (oauthService.hasValidAccessToken() && isApiUrl) {
    const token = oauthService.getAccessToken();

    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};