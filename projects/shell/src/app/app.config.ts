import { ApplicationConfig, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideHotToastConfig } from '@ngxpert/hot-toast';

import { authInterceptor } from './core/auth/auth.interceptor';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    provideHttpClient(withInterceptors([authInterceptor]), withFetch()),

    provideOAuthClient(),

    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return authService.initLogin();
    }),

    provideHotToastConfig({
      position: 'top-right',
      stacking: 'vertical',
      visibleToasts: 5,
    }),
  ],
};
