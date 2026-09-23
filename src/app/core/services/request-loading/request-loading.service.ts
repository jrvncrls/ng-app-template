import { Injectable, Signal, WritableSignal, signal } from '@angular/core';

// Per-request (GET-only) loading state, keyed explicitly via `withLoadingKey`
// at the call site — never auto-derived from a URL. Pair `isLoading(key)`
// with a skeleton placeholder in the component that owns that request.
@Injectable({ providedIn: 'root' })
export class RequestLoadingService {
  private readonly signals = new Map<string, WritableSignal<boolean>>();

  isLoading(key: string): Signal<boolean> {
    return this.getOrCreate(key).asReadonly();
  }

  start(key: string): void {
    this.getOrCreate(key).set(true);
  }

  stop(key: string): void {
    this.getOrCreate(key).set(false);
  }

  private getOrCreate(key: string): WritableSignal<boolean> {
    let entry = this.signals.get(key);
    if (!entry) {
      entry = signal(false);
      this.signals.set(key, entry);
    }
    return entry;
  }
}
