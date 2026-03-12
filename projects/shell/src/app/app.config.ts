import { ApplicationConfig, provideAppInitializer, inject } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHotToastConfig } from '@ngxpert/hot-toast';

import { authInterceptor } from './core/auth/auth.interceptor';
import { serverErrorInterceptor } from './core/interceptors/server-error.interceptor';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { provideIActCloudinary } from '@my-mfe/data-access-media';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideHttpClient(withInterceptors([authInterceptor, serverErrorInterceptor]), withFetch()),
    provideOAuthClient(),

    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return authService.initLogin();
    }),
    provideAnimations(),
    provideIActCloudinary(),

    provideHotToastConfig({
      position: 'top-right',
      stacking: 'vertical',
      visibleToasts: 5,
      style: {
        zIndex: '99999',
      },
    }),
  ],
};
