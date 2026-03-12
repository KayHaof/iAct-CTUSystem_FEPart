const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'shell',

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),

    // --- AUTHENTICATION ---
    'keycloak-angular': { singleton: true, strictVersion: true, requiredVersion: 'auto' },
    'keycloak-js': { singleton: true, strictVersion: true, requiredVersion: 'auto' },
    'angular-oauth2-oidc': { singleton: true, strictVersion: true, requiredVersion: 'auto' },
    '@angular/core': { singleton: true, strictVersion: true },
    '@angular/core/rxjs-interop': { singleton: true, strictVersion: true },

    // --- SHARED LIBRARIES (MFE) ---
    '@my-mfe/auth': {
      singleton: true,
      strictVersion: true,
      version: '0.0.0',
      requiredVersion: '0.0.0',
    },
    '@my-mfe/data-access-realtime': {
      singleton: true,
      strictVersion: true,
      version: '0.0.0',
      requiredVersion: '0.0.0',
    },
    '@my-mfe/data-access-media': {
      singleton: true,
      strictVersion: true,
      version: '0.0.0',
      requiredVersion: '0.0.0',
    },
    '@my-mfe/ui': {
      singleton: true,
      strictVersion: true,
      version: '0.0.0',
      requiredVersion: '0.0.0',
    },

    '@angular/platform-browser/animations': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    },

    '@angular/material': { singleton: true, strictVersion: true, requiredVersion: 'auto' },
    '@angular/cdk': { singleton: true, strictVersion: true, requiredVersion: 'auto' },
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // Add further packages you don't need at runtime
  ],

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

  features: {
    // New feature for more performance and avoiding
    // issues with node libs. Comment this out to
    // get the traditional behavior:
    ignoreUnusedDeps: true,
  },
});
