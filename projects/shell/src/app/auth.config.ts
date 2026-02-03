import { EnvironmentProviders, Provider, provideAppInitializer } from '@angular/core';
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8088',
  realm: 'myRealm',
  clientId: 'myclient123@',
});

function initializeKeycloak() {
  return keycloak.init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
  });
}

export const provideKeycloak: (Provider | EnvironmentProviders)[] = [
  provideAppInitializer(initializeKeycloak),
  { provide: Keycloak, useValue: keycloak },
];
