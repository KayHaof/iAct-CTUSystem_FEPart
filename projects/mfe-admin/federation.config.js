const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'mfe-admin',

  exposes: {
    './routes': 'projects/mfe-admin/src/app/app.routes.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
    'keycloak-angular': { singleton: true, strictVersion: true, requiredVersion: 'auto' },
    'keycloak-js': { singleton: true, strictVersion: true, requiredVersion: 'auto' },
    'angular-oauth2-oidc': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    },

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
  },

  skip: ['rxjs/ajax', 'rxjs/fetch', 'rxjs/testing', 'rxjs/webSocket'],
});
