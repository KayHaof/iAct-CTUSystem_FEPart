import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  progress = signal(0);
  private intervalId: any;
  private startTime: number = 0;

  show() {
    if (this.progress() > 0) return;

    this.startTime = Date.now();

    this.progress.set(10);

    this.intervalId = setInterval(() => {
      this.progress.update((current) => {
        if (current >= 90) return 90;
        return current + Math.random() * 10;
      });
    }, 200);
  }

  hide() {
    const elapsedTime = Date.now() - this.startTime;
    const minDuration = 800;

    const delay = elapsedTime < minDuration ? minDuration - elapsedTime : 0;

    setTimeout(() => {
      this.completeLoading();
    }, delay);
  }

  private completeLoading() {
    if (this.intervalId) clearInterval(this.intervalId);

    this.progress.set(100);

    setTimeout(() => {
      this.progress.set(0);
    }, 300);
  }
}
