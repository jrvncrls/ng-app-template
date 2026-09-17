import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { LOADING_KEY } from '../http/loading-context';
import { LoadingService } from '../services/loading.service';
import { RequestLoadingService } from '../services/request-loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  const requestLoading = inject(RequestLoadingService);

  const isMutating = req.method !== 'GET';
  const loadingKey = req.method === 'GET' ? req.context.get(LOADING_KEY) : undefined;

  if (isMutating) {
    loading.start();
  }
  if (loadingKey) {
    requestLoading.start(loadingKey);
  }

  return next(req).pipe(
    finalize(() => {
      if (isMutating) {
        loading.stop();
      }
      if (loadingKey) {
        requestLoading.stop(loadingKey);
      }
    }),
  );
};
