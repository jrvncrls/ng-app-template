import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';

export type AppRuntimeConfig = Record<string, unknown>;

// Fetched once via `provideAppInitializer` in app.config.ts, which blocks
// bootstrap until `load()` resolves — `config()` is safe to read anywhere
// after that.
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly _config = signal<AppRuntimeConfig | null>(null);
  readonly config = this._config.asReadonly();

  async load(): Promise<void> {
    const config = await firstValueFrom(this.http.get<AppRuntimeConfig>(environment.configUrl));
    this._config.set(config);
  }
}
