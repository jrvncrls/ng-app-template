import { ErrorHandler, Injectable } from '@angular/core';

// Uniform handling for every error type — no special-casing (chunk-load
// errors, etc.) for v1.
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    // TODO: swap-point — send `error` to Sentry/LogRocket/etc. here.
    console.error('[GlobalErrorHandler]', error);
  }
}
