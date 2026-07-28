import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideIActCloudinary } from '@my-mfe/data-access-media';
import { provideIActApiOrigin } from '@my-mfe/ui';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideIActApiOrigin('http://localhost:8080'),
    provideIActCloudinary(),
  ],
};
