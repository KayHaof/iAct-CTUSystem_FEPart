const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'mfe-student',

  exposes: {
    './Routes': 'projects/mfe-student/src/app/app.routes.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
    '@angular/core/primitives/di': { singleton: true, strictVersion: false },
    '@angular/core/primitives/event-dispatch': { singleton: true, strictVersion: false },
    '@angular/core/primitives/signals': { singleton: true, strictVersion: false },
    'keycloak-angular': { singleton: true, strictVersion: true },
    'keycloak-js': { singleton: true, strictVersion: true },
    '@angular/core': { singleton: true, strictVersion: true },
    '@angular/core/rxjs-interop': { singleton: true, strictVersion: true },
    'angular-oauth2-oidc': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    },

    '@my-mfe/auth': { singleton: true, strictVersion: true },
    '@my-mfe/data-access-realtime': { singleton: true, strictVersion: true },
    '@my-mfe/data-access-media': { singleton: true, strictVersion: true },
    '@my-mfe/ui': { singleton: true, strictVersion: true },
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
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
