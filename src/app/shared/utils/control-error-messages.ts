import { ValidationErrors } from '@angular/forms';

// Sensible built-in copy for the validators every form-capable component
// supports out of the box. `errorMessages` input on those components can
// override any of these per-key.
export const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  required: 'This field is required.',
  minlength: 'This value is too short.',
  maxlength: 'This value is too long.',
  pattern: 'This value is not in the correct format.',
  email: 'Please enter a valid email address.',
  // Raised by `date-picker` / `date-range-picker` for text that can't be used.
  invalidDate: 'Please enter a valid date.',
  invalidRange: 'The end date must not be before the start date.',
  minDate: 'This date is too early.',
  maxDate: 'This date is too late.',
  disabledDate: 'This date is not available.',
};

const FALLBACK_MESSAGE = 'This field is invalid.';

/** Picks the message for the first active validation error, or `null` if there is none. */
export function resolveErrorMessage(
  errors: ValidationErrors | null | undefined,
  customMessages: Record<string, string> | undefined,
): string | null {
  if (!errors) {
    return null;
  }

  const [key] = Object.keys(errors);
  if (!key) {
    return null;
  }

  return customMessages?.[key] ?? DEFAULT_ERROR_MESSAGES[key] ?? FALLBACK_MESSAGE;
}
