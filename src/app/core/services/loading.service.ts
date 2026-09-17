import { Injectable, computed, signal } from '@angular/core';

// Global, counter-based loading state. The loading interceptor increments
// this for every non-GET (mutating) request and decrements it when the
// request settles — drives the top-level progress bar.
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly counter = signal(0);
  readonly isLoading = computed(() => this.counter() > 0);

  start(): void {
    this.counter.update((count) => count + 1);
  }

  stop(): void {
    this.counter.update((count) => Math.max(0, count - 1));
  }
}
