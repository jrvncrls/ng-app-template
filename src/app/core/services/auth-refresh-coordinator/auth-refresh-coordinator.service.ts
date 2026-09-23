import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

// Shared in-flight state for the 401 → refresh flow. Lives as an injectable
// singleton (rather than module-level variables) specifically so each
// `TestBed` injector gets a fresh instance — no manual reset needed between
// tests.
@Injectable({ providedIn: 'root' })
export class AuthRefreshCoordinatorService {
  private refreshing = false;
  private readonly refreshed$ = new Subject<string | null>();

  get isRefreshing(): boolean {
    return this.refreshing;
  }

  startRefreshing(): void {
    this.refreshing = true;
  }

  /** Unblocks every queued request with the new token. */
  completeRefresh(accessToken: string): void {
    this.refreshing = false;
    this.refreshed$.next(accessToken);
  }

  /** Unblocks every queued request with `null` so they can re-throw. */
  failRefresh(): void {
    this.refreshing = false;
    this.refreshed$.next(null);
  }

  onRefreshed(): Observable<string | null> {
    return this.refreshed$.asObservable();
  }
}
