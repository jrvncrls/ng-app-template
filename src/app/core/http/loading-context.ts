import { HttpContext, HttpContextToken } from '@angular/common/http';

// Explicit opt-in for per-request (GET-only) loading tracking. Never derived
// from the URL — pass it at the call site:
//   this.http.get(url, { context: withLoadingKey('users-list') })
export const LOADING_KEY = new HttpContextToken<string | undefined>(() => undefined);

export function withLoadingKey(key: string): HttpContext {
  return new HttpContext().set(LOADING_KEY, key);
}
