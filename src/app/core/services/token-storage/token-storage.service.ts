import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'auth_access_token';
// TODO: swap-point — the refresh token lives in sessionStorage for now.
// Production-hardened apps should have the server set it as an httpOnly
// cookie instead: delete this key, drop `refreshToken` from
// `setTokens`/`getRefreshToken`, and let the browser attach the cookie
// automatically (see TokenRefreshService for the other half of this swap).
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  clear(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
