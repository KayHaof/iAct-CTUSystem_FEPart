import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { provideKeycloak } from 'keycloak-angular';

export const authGuard = async () => {
  const keycloak = inject(provideKeycloak);
  const router = inject(Router);

  if (keycloak.isLoggedIn()) {
    return true;
  }

  await keycloak.login({
    redirectUri: window.location.origin + router.url,
  });
  return false;
};
