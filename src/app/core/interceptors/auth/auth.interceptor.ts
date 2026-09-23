import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TokenStorageService } from '../../services/token-storage/token-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const accessToken = inject(TokenStorageService).getAccessToken();

  if (!accessToken) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }));
};
