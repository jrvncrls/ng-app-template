import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const ERROR_MESSAGES: Record<string, string> = {
  '400': 'The request could not be understood by the server.',
  '401': 'Your session has expired. Please sign in again.',
  '403': "You don't have permission to view this page.",
  '404': 'The page you were looking for could not be found.',
  '500': 'Something went wrong on our end. Please try again shortly.',
  '503': 'The service is temporarily unavailable. Please try again later.',
};

const DEFAULT_MESSAGE = 'An unexpected error occurred.';

@Component({
  selector: 'techyon-error-page',
  standalone: true,
  templateUrl: './error-page.html',
  styleUrl: './error-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPage {
  // Bound automatically from the `?code=` query param via
  // `withComponentInputBinding()` (see app.config.ts) — no ActivatedRoute
  // subscription needed.
  readonly code = input<string>('');

  readonly message = computed(() => ERROR_MESSAGES[this.code()] ?? DEFAULT_MESSAGE);
}
