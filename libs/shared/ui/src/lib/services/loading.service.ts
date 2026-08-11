import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  progress = signal(0);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private finishTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private startTime = 0;

  show(): void {
    if (this.finishTimeoutId) {
      clearTimeout(this.finishTimeoutId);
      this.finishTimeoutId = null;
    }

    if (this.intervalId) return;

    this.startTime = Date.now();
    this.progress.set(10);

    this.intervalId = setInterval(() => {
      this.progress.update((current) => {
        if (current >= 90) return 90;
        return Math.min(90, current + Math.max(1.5, (90 - current) * 0.08));
      });
    }, 180);
  }

  hide(): void {
    if (!this.intervalId && this.progress() === 0) return;

    const elapsedTime = Date.now() - this.startTime;
    const minDuration = 480;

    const delay = elapsedTime < minDuration ? minDuration - elapsedTime : 0;

    if (this.finishTimeoutId) {
      clearTimeout(this.finishTimeoutId);
    }

    this.finishTimeoutId = setTimeout(() => {
      this.finishTimeoutId = null;
      this.completeLoading();
    }, delay);
  }

  private completeLoading(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.progress.set(100);

    this.finishTimeoutId = setTimeout(() => {
      this.progress.set(0);
      this.finishTimeoutId = null;
    }, 300);
  }
}
