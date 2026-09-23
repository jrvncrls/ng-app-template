import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { skipAuthHandling } from '../../http/skip-auth-handling.context';
import { TokenStorageService } from '../token-storage/token-storage.service';

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);

  refresh(): Observable<string> {
    // TODO: swap-point — reads the refresh token out of sessionStorage.
    // Production-hardened apps should instead rely on an httpOnly cookie:
    // drop `refreshToken` from the request body and add
    // `{ withCredentials: true }` to the request options so the browser
    // attaches the cookie automatically. `TokenStorageService` is the only
    // other place that needs to change alongside this.
    const refreshToken = this.tokenStorage.getRefreshToken();

    return this.http
      .post<RefreshResponse>(
        `${environment.apiUrl}/auth/refresh`,
        { refreshToken },
        { context: skipAuthHandling() },
      )
      .pipe(
        map((response) => {
          this.tokenStorage.setTokens(response.accessToken, response.refreshToken);
          return response.accessToken;
        }),
      );
  }
}
