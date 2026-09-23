import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { NotificationService } from '../../services/notification/notification.service';
import { TokenRefreshService } from '../../services/token-refresh/token-refresh.service';
import { TokenStorageService } from '../../services/token-storage/token-storage.service';
import { errorInterceptor } from './error.interceptor';

// Reference spec: demonstrates testing the 401 → refresh → queue → retry
// flow of a functional interceptor. `AuthRefreshCoordinatorService` is left
// un-mocked and injected for real — that's what serializes the two
// concurrent 401s in the second test into a single refresh call, and a
// fresh instance of it is created per `TestBed.configureTestingModule` call,
// so no manual reset between tests is needed.
describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };
  let notify: { error: ReturnType<typeof vi.fn> };
  let tokenRefresh: { refresh: ReturnType<typeof vi.fn> };
  let tokenStorage: { clear: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    router = { navigateByUrl: vi.fn() };
    notify = { error: vi.fn() };
    tokenRefresh = { refresh: vi.fn() };
    tokenStorage = { clear: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        { provide: NotificationService, useValue: notify },
        { provide: TokenRefreshService, useValue: tokenRefresh },
        { provide: TokenStorageService, useValue: tokenStorage },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('redirects to /error?code=403 on a 403 response', () => {
    httpClient.get('/api/thing').subscribe({ error: () => {} });

    httpMock.expectOne('/api/thing').flush(null, { status: 403, statusText: 'Forbidden' });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/error?code=403');
  });

  it('pushes a notification on a 500 response instead of redirecting', () => {
    httpClient.get('/api/thing').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/thing')
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(notify.error).toHaveBeenCalledWith('boom');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  describe('401 handling', () => {
    it('refreshes the token once and retries the original request with it', () => {
      tokenRefresh.refresh.mockReturnValue(of('new-access-token'));

      let result: unknown;
      httpClient.get('/api/thing').subscribe((res) => (result = res));

      httpMock.expectOne('/api/thing').flush(null, { status: 401, statusText: 'Unauthorized' });

      const retried = httpMock.expectOne('/api/thing');
      expect(retried.request.headers.get('Authorization')).toBe('Bearer new-access-token');
      retried.flush({ ok: true });

      expect(result).toEqual({ ok: true });
      expect(tokenRefresh.refresh).toHaveBeenCalledTimes(1);
    });

    it('queues a request that 401s while a refresh is already in flight, and retries both once it resolves', () => {
      let releaseRefresh!: (token: string) => void;
      tokenRefresh.refresh.mockReturnValue(
        new Observable<string>((subscriber) => {
          releaseRefresh = (token) => {
            subscriber.next(token);
            subscriber.complete();
          };
        }),
      );

      const results: unknown[] = [];
      httpClient.get('/api/a').subscribe((res) => results.push(res));
      httpClient.get('/api/b').subscribe((res) => results.push(res));

      httpMock.expectOne('/api/a').flush(null, { status: 401, statusText: 'Unauthorized' });
      httpMock.expectOne('/api/b').flush(null, { status: 401, statusText: 'Unauthorized' });

      // Both requests 401'd, but only one refresh call should have fired.
      expect(tokenRefresh.refresh).toHaveBeenCalledTimes(1);

      releaseRefresh('shared-token');

      const retriedA = httpMock.expectOne('/api/a');
      const retriedB = httpMock.expectOne('/api/b');
      expect(retriedA.request.headers.get('Authorization')).toBe('Bearer shared-token');
      expect(retriedB.request.headers.get('Authorization')).toBe('Bearer shared-token');

      retriedA.flush({ from: 'a' });
      retriedB.flush({ from: 'b' });

      expect(results).toEqual([{ from: 'a' }, { from: 'b' }]);
    });

    it('clears tokens and redirects to /error?code=401 when the refresh call itself fails', () => {
      tokenRefresh.refresh.mockReturnValue(throwError(() => new Error('refresh failed')));

      let caught: unknown;
      httpClient.get('/api/thing').subscribe({ error: (err) => (caught = err) });

      httpMock.expectOne('/api/thing').flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(tokenStorage.clear).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/error?code=401');
      expect(caught).toBeTruthy();
    });
  });
});
