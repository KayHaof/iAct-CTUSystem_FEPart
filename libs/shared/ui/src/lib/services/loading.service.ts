import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  progress = signal(0);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;

  show(): void {
    if (this.progress() > 0) return;

    this.startTime = Date.now();
    this.progress.set(10);

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.progress.update((current) => {
        if (current >= 90) return 90;
        return current + Math.random() * 10;
      });
    }, 200);
  }

  hide(): void {
    const elapsedTime = Date.now() - this.startTime;
    const minDuration = 800;

    const delay = elapsedTime < minDuration ? minDuration - elapsedTime : 0;

    setTimeout(() => {
      this.completeLoading();
    }, delay);
  }

  private completeLoading(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.progress.set(100);

    setTimeout(() => {
      this.progress.set(0);
    }, 300);
  }
}