const { withNativeFederation } = require('@angular-architects/native-federation/config');

const sharedPackage = { singleton: true, strictVersion: true, requiredVersion: 'auto' };
const sharedWorkspaceLibrary = {
  singleton: true,
  strictVersion: true,
  version: '0.0.0',
  requiredVersion: '0.0.0',
};

module.exports = withNativeFederation({
  name: 'mfe-admin',

  exposes: {
    './routes': 'projects/mfe-admin/src/app/app.routes.ts',
  },

  shared: {
    '@angular/animations': sharedPackage,
    '@angular/common': sharedPackage,
    '@angular/common/http': sharedPackage,
    '@angular/core': sharedPackage,
    '@angular/core/rxjs-interop': sharedPackage,
    '@angular/core/primitives/di': { ...sharedPackage, strictVersion: false },
    '@angular/core/primitives/event-dispatch': { ...sharedPackage, strictVersion: false },
    '@angular/core/primitives/signals': { ...sharedPackage, strictVersion: false },
    '@angular/forms': sharedPackage,
    '@angular/platform-browser': sharedPackage,
    '@angular/platform-browser/animations': sharedPackage,
    '@angular/router': sharedPackage,
    '@angular/cdk': sharedPackage,
    '@angular/material': sharedPackage,
    'angular-oauth2-oidc': sharedPackage,
    rxjs: sharedPackage,
    'rxjs/operators': sharedPackage,
    '@my-mfe/auth': sharedWorkspaceLibrary,
    '@my-mfe/data-access-realtime': sharedWorkspaceLibrary,
    '@my-mfe/data-access-media': sharedWorkspaceLibrary,
    '@my-mfe/ui': sharedWorkspaceLibrary,
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    'apexcharts',
    'xlsx',
    '@zxing/browser',
    '@zxing/library',
    '@zxing/ngx-scanner',
    '@stomp/rx-stomp',
    '@stomp/stompjs',
  ],

  features: {
    ignoreUnusedDeps: true,
  },
});
