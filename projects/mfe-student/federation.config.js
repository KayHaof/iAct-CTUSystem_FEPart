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
    '@my-mfe/auth': { singleton: true, strictVersion: true, version: '0.0.0', requiredVersion: '0.0.0' },
    '@my-mfe/ui': { singleton: true, strictVersion: true, version: '0.0.0', requiredVersion: '0.0.0' },
    '@my-mfe/interface': { singleton: true, strictVersion: true, version: '0.0.0', requiredVersion: '0.0.0' },
    '@my-mfe/data-access-media': { singleton: true, strictVersion: true, version: '0.0.0', requiredVersion: '0.0.0' },
    '@my-mfe/data-access-realtime': { singleton: true, strictVersion: true, version: '0.0.0', requiredVersion: '0.0.0' },
    '@my-mfe/data-access-notification': { singleton: true, strictVersion: true, version: '0.0.0', requiredVersion: '0.0.0' },
    '@my-mfe/data-access-activity': { singleton: true, strictVersion: true, version: '0.0.0', requiredVersion: '0.0.0' },
    '@my-mfe/student-shared': { singleton: true, strictVersion: true, version: '0.0.0', requiredVersion: '0.0.0' },
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
  ],

  features: {
    ignoreUnusedDeps: true,
  },
});
