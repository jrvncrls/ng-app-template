# CLAUDE.md

This file documents the conventions this Angular 20 boilerplate was built around. It exists so
future AI-assisted (and human) work on this codebase extends it consistently instead of
reinventing or drifting from these decisions. When in doubt, follow the pattern in the two fully
worked reference files called out below rather than inventing a new one.

## Foundation

- Angular 20, **standalone components only**. No NgModules anywhere, ever.
- **Signals-first.** State is `signal()` / `computed()` / `model()` / `input()` /
  `input.required()`. No RxJS-based app state (no NgRx, no Elf, no hand-rolled
  `BehaviorSubject` services). RxJS still appears where Angular's own APIs are inherently
  Observable-based — `HttpClient`, interceptors, `AbstractControl.statusChanges` — that's
  unavoidable plumbing, not app state, and it's fine.
- Folder structure under `src/app/`:
  - `core/` — singleton services (`providedIn: 'root'`), functional interceptors, functional
    guards, the global `ErrorHandler`. Also `core/models/` (shared interfaces) and `core/http/`
    (small `HttpContextToken` helpers). Nothing here is imported by a feature more than once —
    if it needs to be instantiated per-use, it doesn't belong in `core/`.
    `core/services/`, `core/guards/`, and `core/interceptors/` are each one folder per unit
    (e.g. `core/services/modal/modal.service.ts`, `core/guards/auth/auth.guard.ts`,
    `core/interceptors/error/error.interceptor.ts`), same shape as `shared/components/` below —
    the folder is named after the unit with its `.service`/`.guard`/`.interceptor` suffix
    dropped, and any files it collaborates with (a `-ref` class, injection tokens, etc. — see
    `services/modal/`) live alongside it in that folder. `core/http/` and `core/models/` stay
    flat — small token helpers and plain interfaces with no spec companion, not one-per-file
    units.
  - `shared/` — `components/` (one folder per component), `pipes/`, `services/` (non-singleton,
    reusable utilities — currently an empty scaffold), and `utils/` (pure helper functions, e.g.
    `control-error-messages.ts`, that don't warrant a class).
  - `features/` — lazy-loaded feature areas, each registering its own routes. Currently just
    `error-page/`; add new features as sibling folders with a `loadComponent`/`loadChildren`
    entry in `app.routes.ts`.
- **Naming:** components have no suffix (`Button`, `Modal`, `InputText`, `ErrorPage`, `App`) —
  this matches Angular's current style guide and the CLI's own scaffold (`App`, not
  `AppComponent`). Services keep the `Service` suffix (`LoadingService`). Guards and
  interceptors are camelCase functions with a `Guard`/`Interceptor` suffix (`authGuard`,
  `errorInterceptor`). Pipes are `XyzPipe` classes with a camelCase `name` in the decorator.

## Design tokens (`src/styles/`)

Three layers, strictly one-directional — never skip a layer:

1. **Primitives** (`styles/tokens/_primitives.<brand>.scss`) — raw HSLA values in SCSS maps,
   emitted as CSS custom properties scoped to `[data-brand="<brand>"]` (the default brand is
   also seeded onto `:root`). **To add a brand:** copy `_primitives.default.scss`, keep every
   map key identical, change the HSLA values, call `primitive-tokens(...)` with
   `$is-default: false`, and add a `@forward` line for it in `styles/tokens.scss`. Nothing
   outside this one new file changes.
2. **Semantic** (`styles/tokens/_semantic.scss`) — references primitive CSS vars only
   (`var(--color-primary-400)`), never a raw color. Defined once per `$light` / `$dark` SCSS map,
   emitted under `[data-theme="light"]` / `[data-theme="dark"]` (light is also seeded onto
   `:root`). The map's keys are exported as `$semantic-color-tokens` — that list is the single
   source of truth `_color-utilities.scss` loops over, so a new semantic token automatically
   gets `.text-*` / `.bg-*` / `.border-*` utility classes.
3. **Component-level SCSS** references semantic tokens only — `var(--color-surface)`,
   `var(--space-3)`, `var(--radius-md)` — never a primitive var and never a hardcoded value. No
   component may hardcode a color, padding, border width, or border radius.

Naming convention (confirmed with the project owner before the component set was built):
`--color-{role}-{shade}`. Primitives: `--color-primary-500`, `--color-grey-100`. Semantic:
`--color-surface`, `--color-text-primary`, `--color-status-bg-active`. Non-color tokens follow
the same `--{category}-{name}` shape: `--space-4`, `--radius-md`, `--border-width-thin`,
`--font-size-body-md`, `--font-weight-semibold`, `--font-size-h1`.

**A primitive var name must never equal a semantic one.** Both layers are emitted on `:root`, so
`--color-x: var(--color-x)` is a circular reference and the property silently becomes invalid.
That's why the flat primitives are `--color-status-fill-*`, `--color-status-ink-*`,
`--color-white-base` and `--color-accent-base` while the semantic tokens are `--color-status-bg-*`,
`--color-status-text-*`, `--color-white` and `--color-accent`.

Typography lives in its own file (`styles/tokens/_typography.scss`), theme/brand-independent,
`:root`-only: font family, `h1`–`h6` (size + line-height + weight per level), and body sizes
`xs`/`sm`/`md`(16px base)/`lg`/`xl`. `styles/utilities/_typography-utilities.scss` generates
`.text-h1`…`.text-h6` and one `.text-body-{size}-{weight}` class per size×weight combination
(20 classes) by looping over the same maps — add a heading level or body size there, not here.

Spacing/radius/border-width (`styles/tokens/_spacing.scss`) aren't part of the original color
palette spec but exist because the "no hardcoded padding/border/radius" rule requires
_something_ to reference; they follow the identical map-driven, `:root`-only pattern.

`data-brand` and `data-theme` are set on `<html>` in `index.html` (`data-brand="default"
data-theme="light"` by default) — switching either at runtime (e.g. a theme toggle) is just
updating those two attributes; every component repaints automatically since it's all
`var(--...)`.

## Shared component contract (`shared/components/`)

Every component:

- Is standalone, signals-based, `ChangeDetectionStrategy.OnPush`.
- Has `readonly testId = input.required<string>();` bound to the host as
  `host: { '[attr.data-testid]': 'testId()' }` — not a template attribute, so it's set even
  before the template renders.
- Is styled entirely from semantic/typography/spacing tokens (see above) — no hardcoded values.
- Uses minimal animation (simple `transition`s on hover/focus states; no elaborate motion).

**Form-capable components** (`input-text`, `select`, `multi-select`, `checkbox`, `radio`,
`textarea`, `autocomplete`, `toggle`) additionally:

- Use `readonly value = model<T>(initial);` as the single source of truth. `writeValue` sets it;
  a `constructor` `effect(() => this.onChange(this.value()))` propagates it back out — this is
  what "CVA built on top of the model signal" means concretely.
- Implement `ControlValueAccessor`, but **do not** provide `NG_VALUE_ACCESSOR` via the
  `providers` array. Instead:
  ```ts
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
    effect(() => this.onChange(this.value()));
  }
  ```
  Combining a static `NG_VALUE_ACCESSOR` provider with a `@Self()` `NgControl` injection on the
  same component throws `NG0200` (circular dependency) — Angular needs `NG_VALUE_ACCESSOR`
  resolved to build the `NgControl` this class also depends on. Wiring `valueAccessor` manually
  (the same pattern Angular Material's custom form controls use) sidesteps it, and is required
  here because reading `ngControl.control.errors` for inline validation is part of the contract.
  **Copy this exact pattern for any new form-capable component; don't reintroduce the provider.**
- Show validation errors only once `touched` is true (set on `(blur)`), never live on keystroke.
- Accept `errorMessages = input<Record<string, string>>()` to override the built-in defaults in
  `shared/utils/control-error-messages.ts` (`required`, `minlength`, `maxlength`, `pattern`,
  `email`). `resolveErrorMessage(errors, customMessages)` is the one place that resolution logic
  lives — reuse it, don't reimplement it per component.
- Work identically standalone (`[(value)]`) or in a reactive form (`formControlName`/
  `[formControl]`) — `ngControl` is simply `null` in the standalone case.

**Reference implementation:** `shared/components/input-text/` — read `input-text.ts` and
`input-text.spec.ts` before building a new form-capable component or its tests.

## HTTP layer (`core/interceptors/`, `core/services/`, `core/http/`)

Interceptors are registered in `app.config.ts` via `provideHttpClient(withInterceptors([...]))`,
in this order: `authInterceptor`, `errorInterceptor`, `loadingInterceptor`.

- **`authInterceptor`** — attaches `Authorization: Bearer <token>` from
  `TokenStorageService.getAccessToken()` (sessionStorage). No-ops if there's no token.
- **`errorInterceptor`** — the two arrays at the top of the file (`REDIRECT_STATUS_CODES`,
  `NOTIFY_STATUS_CODES`) are the single place that decides how a status is classified:
  - `403`, `503` (and anything else added to `REDIRECT_STATUS_CODES`) → `router.navigateByUrl('/error?code=' + status)`.
  - `400`, `500` (and anything else added to `NOTIFY_STATUS_CODES`) → `notify.error(...)`.
  - `401` → refresh flow (below).
  - Everything else passes through untouched.
- **`loadingInterceptor`** — increments/decrements `LoadingService`'s counter for every
  non-`GET` request (drives the top progress bar in `app.html`). For `GET` requests, if
  `req.context` carries a `LOADING_KEY` (set via `withLoadingKey('some-key')` from
  `core/http/loading-context.ts`, passed explicitly at the call site — **never** derive it from
  the URL), it also flips `RequestLoadingService`'s per-key signal. Requests without a loading
  key are simply untracked.

**401 → refresh → queue → retry**, implemented in `errorInterceptor` /
`AuthRefreshCoordinatorService` / `TokenRefreshService`:

1. First 401 to arrive: `AuthRefreshCoordinatorService.isRefreshing` is false, so it calls
   `TokenRefreshService.refresh()`, sets `isRefreshing = true` for the duration.
2. Any other request that 401s while that's in flight queues on
   `coordinator.onRefreshed()` (an internal `Subject<string | null>`) instead of firing its own
   refresh call.
3. On success, every queued request retries with the new token; on failure, every queued request
   re-throws its own original error, tokens are cleared, and the router navigates to
   `/error?code=401`.
4. The refresh HTTP call itself is tagged with `skipAuthHandling()` (`core/http/
skip-auth-handling.context.ts`) so a 401 _from the refresh endpoint_ doesn't recurse back into
   step 1 — it goes straight to `/error?code=401`.

`AuthRefreshCoordinatorService` is deliberately an injectable singleton rather than a
module-level variable specifically so tests get a fresh instance for free from a new
`TestBed.configureTestingModule` — no manual reset needed.

**`// TODO: swap-point`** comments mark the two places a production-hardened app should swap
sessionStorage for an httpOnly refresh cookie: `TokenStorageService` (where the refresh token is
read/written) and `TokenRefreshService.refresh()` (where it's sent). Both are small,
self-contained changes — the interceptor logic itself doesn't need to change.

**Reference implementation:** `core/interceptors/error.interceptor.spec.ts` — read it before
touching the refresh flow or writing a test that exercises it.

## Notification system (`core/services/notification.service.ts`, `shared/components/notification-bar/`)

Custom-built, signal-based — no third-party toast library. Inject as `notify` at call sites:

```ts
private readonly notify = inject(NotificationService);
this.notify.success('Saved.');
this.notify.error('Could not save.', { duration: 6000, position: 'bottom' });
```

`duration` (ms, default 4000, `0` disables auto-dismiss) and `position` (`'top' | 'bottom'`,
default `'top'`) are optional per call. `<app-notification-bar testId="app-notifications" />` is
mounted once in `app.html` and renders the full stack (multiple notifications visible at once),
split into a top and bottom container.

## Loading state

- **Global** (`LoadingService`) — counter-based; every non-`GET` request increments it via
  `loadingInterceptor`. `loading.isLoading()` drives the fixed progress bar in `app.html`. Don't
  call `start()`/`stop()` manually from feature code — it's interceptor-owned.
- **Per-request** (`RequestLoadingService`), `GET` only — opt in explicitly:
  ```ts
  this.http.get(url, { context: withLoadingKey('users-list') });
  ```
  then read `requestLoading.isLoading('users-list')` in the component to drive an `ngx-skeleton`
  placeholder. Requests without a key are untracked; keys are never inferred from the URL.

## Guards (`core/guards/`)

- `authGuard` — no access token → redirect to `/error?code=401`.
- `roleGuard(allowedRoles: string[])` — **stub.** The structure (a guard factory returning a
  `CanActivateFn`) is in place, but it currently always allows. It injects `UserSessionService`
  so the eventual implementation (compare `currentUser().roles` against `allowedRoles`, redirect
  to `/error?code=403` on mismatch) is a small diff once `UserSessionService` is wired to a real
  auth flow — the intended body is sketched in a comment in the file.

## Error page (`features/error-page/`)

Route: `/error?code=<status>` (see `app.routes.ts`; unmatched routes wildcard-redirect here).
`code` is bound straight to a component `input()` via `withComponentInputBinding()` (set in
`app.config.ts`'s `provideRouter`) — no `ActivatedRoute` subscription needed. Add new codes to
the `ERROR_MESSAGES` map in `error-page.ts`; unrecognized codes fall back to a generic message.

## Environment config

`src/environments/environment.ts` (dev, default) and `environment.prod.ts` — swapped via the
`production` build configuration's `fileReplacements` in `angular.json` (`ng serve`/`ng build`
default to dev; `ng build --configuration production` swaps in the prod file). Each exports
`{ production, apiUrl, configUrl }`. `ConfigService` fetches `configUrl` via
`provideAppInitializer` in `app.config.ts`, which blocks bootstrap until it resolves — anything
reading `configService.config()` after that point can assume it's populated.

## Testing

Vitest via Angular's `@angular/build:unit-test` builder (`ng test` / `npm test`) — not
Karma/Jasmine. `describe`/`it`/`expect`/`vi`/etc. are globals (`vitest/globals` in
`tsconfig.spec.json`), so spec files don't import them, matching the CLI-generated `app.spec.ts`.

Two files are fully worked reference patterns — copy their structure for anything similar rather
than writing a new testing approach from scratch:

1. **`shared/components/input-text/input-text.spec.ts`** — a CVA-based, signal-backed form
   component: standalone `[(value)]` usage, `writeValue`/`registerOnChange`/`registerOnTouched`/
   `setDisabledState`, and a real `[formControl]`-bound host component to test the
   touched-gated, `errorMessages`-overridable validation display.
2. **`core/interceptors/error.interceptor.spec.ts`** — the 401 → refresh → queue → retry flow,
   using `HttpTestingController` and letting `AuthRefreshCoordinatorService` run un-mocked (that's
   what proves two concurrent 401s produce exactly one refresh call).

Every other component/service/pipe/guard/interceptor has a minimal stub spec (the same shape the
Angular CLI itself generates: instantiate it, assert it's truthy, set any `input.required()`
values first). Fill those in as real behavior is added — don't leave a component's tests as the
stub once it has non-trivial logic.

No e2e testing in v1.

## Tooling

ESLint (flat config, `eslint.config.js`) via `angular-eslint`'s recommended + accessibility
template rules, with `eslint-config-prettier` layered on top so formatting rules never fight
Prettier. Notable local overrides: `@typescript-eslint/no-empty-function` allows arrow functions
(the CVA no-op default callbacks are legitimately empty until `register*` is called), and
`@typescript-eslint/no-unused-vars` ignores `_`-prefixed names (used by `roleGuard`'s
currently-unused `_allowedRoles` stub parameter). `npm run lint`, `npm run format` / `format:check`.
