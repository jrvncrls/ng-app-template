import { Injectable, signal } from '@angular/core';

import { AppUser } from '../models/user.model';

// Stub — no login/logout logic yet. `currentUser` is the single source of
// truth other code (roleGuard, nav, etc.) should read from once this is
// wired up to a real auth flow.
@Injectable({ providedIn: 'root' })
export class UserSessionService {
  readonly currentUser = signal<AppUser | null>(null);
}
