import { HttpContext, HttpContextToken } from '@angular/common/http';

// Marks a request (the token-refresh call itself) so the error interceptor
// doesn't try to refresh-and-retry a 401 coming from the refresh endpoint —
// that would recurse forever.
export const SKIP_AUTH_HANDLING = new HttpContextToken<boolean>(() => false);

export function skipAuthHandling(): HttpContext {
  return new HttpContext().set(SKIP_AUTH_HANDLING, true);
}
