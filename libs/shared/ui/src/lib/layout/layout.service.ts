import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private readonly mobileBreakpoint = 768;

  readonly isMobileMenuOpen = signal(false);

  private readonly windowWidth = signal(1024);

  readonly isMobile = computed(() => this.windowWidth() < this.mobileBreakpoint);
  readonly isTablet = computed(
    () => this.windowWidth() >= this.mobileBreakpoint && this.windowWidth() < 1024,
  );
  readonly isDesktop = computed(() => this.windowWidth() >= 1024);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const updateViewport = () => {
        this.windowWidth.set(window.innerWidth);
        if (window.innerWidth >= this.mobileBreakpoint) {
          this.isMobileMenuOpen.set(false);
        }
      };

      updateViewport();
      window.addEventListener('resize', updateViewport, { passive: true });
      this.destroyRef.onDestroy(() => window.removeEventListener('resize', updateViewport));
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
