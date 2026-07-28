import { InjectionToken, Provider } from '@angular/core';

export const IACT_API_ORIGIN = new InjectionToken<string>('IACT_API_ORIGIN', {
  providedIn: 'root',
  factory: () => 'http://localhost:8080',
});

export function provideIActApiOrigin(origin: string): Provider {
  return {
    provide: IACT_API_ORIGIN,
    useValue: origin.replace(/\/$/, ''),
  };
}
