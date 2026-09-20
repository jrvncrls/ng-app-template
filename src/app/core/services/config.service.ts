import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

import { applyBrandColors } from '../../shared/utils/brand-colors';

export interface AppRuntimeConfig {
  appName: string;
  brand: string;
  theme: 'light' | 'dark';
  // 6-digit hex; primary/secondary are the 400 shade, greyscaleBase is the
  // grey 900 shade. The rest of each ramp is derived.
  colors: { primary: string; secondary: string; greyscaleBase: string };
  logo: { light: string; dark: string; alt: string };
  favicon: string;
}

// TODO: swap-point — no backend yet, so `load()` resolves this constant. Once
// `environment.configUrl` serves the real response, fetch it with HttpClient
// here instead (same shape).
const DEFAULT_CONFIG: AppRuntimeConfig = {
  appName: 'NgAppTemplate',
  brand: 'default',
  theme: 'light',
  colors: { primary: '#111827', secondary: '#27A376', greyscaleBase: '#111827' },
  logo: { light: 'logo-light.svg', dark: 'logo-dark.svg', alt: 'NgAppTemplate' },
  favicon: 'favicon.ico',
};

// Loaded once via `provideAppInitializer` in app.config.ts, which blocks
// bootstrap until `load()` resolves — `config()` is safe to read anywhere
// after that.
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly document = inject(DOCUMENT);
  private readonly _config = signal<AppRuntimeConfig | null>(null);
  readonly config = this._config.asReadonly();

  async load(): Promise<void> {
    this._config.set(DEFAULT_CONFIG);
    applyBrandColors(this.document.documentElement, DEFAULT_CONFIG.colors);
  }
}
