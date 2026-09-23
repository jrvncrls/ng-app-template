import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';

import { UserSessionService } from '../../services/user-session/user-session.service';

// Stub — structure is in place but not enforced yet, since
// `UserSessionService.currentUser` isn't populated by a real auth flow.
//
// Usage once wired up:
//   { path: 'admin', canActivate: [roleGuard(['admin'])], ... }
//
// Intended implementation once user-session is built out:
//   const user = inject(UserSessionService).currentUser();
//   if (!user || !allowedRoles.some((role) => user.roles.includes(role))) {
//     return inject(Router).parseUrl('/error?code=403');
//   }
//   return true;
export function roleGuard(_allowedRoles: string[]): CanActivateFn {
  return () => {
    inject(UserSessionService);
    return true;
  };
}
