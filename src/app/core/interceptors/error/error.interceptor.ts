import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, take, throwError } from 'rxjs';

import { SKIP_AUTH_HANDLING } from '../../http/skip-auth-handling.context';
import { AuthRefreshCoordinatorService } from '../../services/auth-refresh-coordinator/auth-refresh-coordinator.service';
import { NotificationService } from '../../services/notification/notification.service';
import { TokenRefreshService } from '../../services/token-refresh/token-refresh.service';
import { TokenStorageService } from '../../services/token-storage/token-storage.service';

// Extend these two lists to reclassify a status — they're the only place
// that decides "redirect to /error" vs. "toast a notification".
const REDIRECT_STATUS_CODES: readonly number[] = [403, 503];
const NOTIFY_STATUS_CODES: readonly number[] = [400, 500];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notify = inject(NotificationService);
  const tokenStorage = inject(TokenStorageService);
  const tokenRefresh = inject(TokenRefreshService);
  const coordinator = inject(AuthRefreshCoordinatorService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        if (req.context.get(SKIP_AUTH_HANDLING)) {
          // The refresh call itself came back 401 — the session is unrecoverable.
          router.navigateByUrl('/error?code=401');
          return throwError(() => error);
        }

        return handleUnauthorized(req, next, error, {
          router,
          tokenStorage,
          tokenRefresh,
          coordinator,
        });
      }

      if (REDIRECT_STATUS_CODES.includes(error.status)) {
        router.navigateByUrl(`/error?code=${error.status}`);
      } else if (NOTIFY_STATUS_CODES.includes(error.status)) {
        notify.error(error.error?.message ?? `Request failed (${error.status}).`);
      }

      return throwError(() => error);
    }),
  );
};

interface UnauthorizedDeps {
  router: Router;
  tokenStorage: TokenStorageService;
  tokenRefresh: TokenRefreshService;
  coordinator: AuthRefreshCoordinatorService;
}

function handleUnauthorized(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  originalError: HttpErrorResponse,
  { router, tokenStorage, tokenRefresh, coordinator }: UnauthorizedDeps,
): Observable<HttpEvent<unknown>> {
  if (!coordinator.isRefreshing) {
    coordinator.startRefreshing();

    return tokenRefresh.refresh().pipe(
      switchMap((accessToken) => {
        coordinator.completeRefresh(accessToken);
        return next(attachToken(req, accessToken));
      }),
      catchError((refreshError) => {
        coordinator.failRefresh();
        tokenStorage.clear();
        router.navigateByUrl('/error?code=401');
        return throwError(() => refreshError);
      }),
    );
  }

  // A refresh is already in flight for a different request — queue this one
  // and retry it (or re-throw) once that refresh settles.
  return coordinator.onRefreshed().pipe(
    take(1),
    switchMap((accessToken) => {
      if (!accessToken) {
        return throwError(() => originalError);
      }
      return next(attachToken(req, accessToken));
    }),
  );
}

function attachToken(req: HttpRequest<unknown>, accessToken: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
}
