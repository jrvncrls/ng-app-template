// Pure date helpers for `calendar`, `date-picker` and `date-range-picker`.
//
// Everything works on *local* calendar days — a "date" here is a `Date` at
// local midnight, and comparisons ignore the time of day. That keeps the
// pickers free of the timezone off-by-one bugs you get from mixing UTC and
// local parsing (e.g. `new Date('2026-01-02')` is UTC midnight).

/** 0 = Sunday … 6 = Saturday. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateConstraints {
  min?: Date | null;
  max?: Date | null;
  /** Return `true` for a date that must not be selectable. */
  isDateDisabled?: ((date: Date) => boolean) | null;
}

/** Keys double as the `errorMessages` keys on the pickers. */
export type DateConstraintError = 'minDate' | 'maxDate' | 'disabledDate';

export const DATE_RANGE_SEPARATOR = ' – ';

const FORMAT_TOKENS = /yyyy|MM|dd/g;
const RANGE_SEPARATOR = /\s+(?:–|—|-|to)\s+/i;

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

// `new Date(y, m, d)` maps years 0–99 onto 1900–1999; `setFullYear` doesn't.
// Month/day overflow rolls over (month 12 → January of the next year, day 0 →
// last day of the previous month), which the helpers below rely on.
function createDate(year: number, month: number, day: number): Date {
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function startOfDay(date: Date): Date {
  return createDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return createDate(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return createDate(date.getFullYear(), date.getMonth() + 1, 0);
}

export function startOfWeek(date: Date, weekStartsOn: WeekStart): Date {
  const offset = (date.getDay() - weekStartsOn + 7) % 7;
  return addDays(date, -offset);
}

export function addDays(date: Date, days: number): Date {
  return createDate(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Keeps the day of month where it exists, otherwise clamps (Jan 31 + 1 month → Feb 28/29). */
export function addMonths(date: Date, months: number): Date {
  const first = createDate(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = endOfMonth(first).getDate();
  return createDate(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), lastDay));
}

export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
}

/** True when both are the same calendar day, or both are empty. */
export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) {
    return !a && !b;
  }
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameDateRange(
  a: DateRange | null | undefined,
  b: DateRange | null | undefined,
): boolean {
  if (!a || !b) {
    return !a && !b;
  }
  return isSameDay(a.start, b.start) && isSameDay(a.end, b.end);
}

/** Negative when `a` is before `b`, positive when after, `0` for the same day. */
export function compareDays(a: Date, b: Date): number {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

/** Pulls `date` inside `[min, max]`; a missing bound is open-ended. */
export function clampDate(date: Date, min?: Date | null, max?: Date | null): Date {
  if (min && compareDays(date, min) < 0) {
    return startOfDay(min);
  }
  if (max && compareDays(date, max) > 0) {
    return startOfDay(max);
  }
  return date;
}

/** A fixed 6×7 grid of days covering `month`, so the calendar's height never jumps. */
export function getMonthGrid(month: Date, weekStartsOn: WeekStart): Date[][] {
  const first = startOfWeek(startOfMonth(month), weekStartsOn);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(first, week * 7 + day)),
  );
}

export function getDateError(
  date: Date,
  { min, max, isDateDisabled }: DateConstraints,
): DateConstraintError | null {
  if (min && compareDays(date, min) < 0) {
    return 'minDate';
  }
  if (max && compareDays(date, max) > 0) {
    return 'maxDate';
  }
  if (isDateDisabled?.(date)) {
    return 'disabledDate';
  }
  return null;
}

/**
 * Formats with `yyyy`, `MM` and `dd` tokens; anything else in `format` is
 * copied through as-is (`'MM/dd/yyyy'`, `'dd.MM.yyyy'`, `'yyyy-MM-dd'`).
 */
export function formatDate(date: Date, format: string): string {
  return format.replace(FORMAT_TOKENS, (token) => {
    switch (token) {
      case 'yyyy':
        return String(date.getFullYear()).padStart(4, '0');
      case 'MM':
        return String(date.getMonth() + 1).padStart(2, '0');
      default:
        return String(date.getDate()).padStart(2, '0');
    }
  });
}

// Separators made of `/`, `.`, `-` or spaces match any run of those, so a user
// can type `1/2/2026` or `01-02-2026` into a `MM/dd/yyyy` field.
function separatorPattern(separator: string): string {
  if (/^[/.\- ]+$/.test(separator)) {
    return '[/.\\- ]+';
  }
  return separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Strict counterpart of {@link formatDate}: the result is `null` unless the
 * text is a real calendar date (so `02/30/2026` is rejected, not rolled over).
 * `format` must contain each of `yyyy`, `MM` and `dd` exactly once.
 */
export function parseDate(text: string, format: string): Date | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const tokens: string[] = [];
  let pattern = '';
  let cursor = 0;
  for (const match of format.matchAll(FORMAT_TOKENS)) {
    pattern += separatorPattern(format.slice(cursor, match.index));
    pattern += match[0] === 'yyyy' ? '(\\d{4})' : '(\\d{1,2})';
    tokens.push(match[0]);
    cursor = match.index + match[0].length;
  }
  pattern += separatorPattern(format.slice(cursor));

  if (tokens.length !== 3 || new Set(tokens).size !== 3) {
    return null;
  }

  const parts = new RegExp(`^${pattern}$`).exec(trimmed);
  if (!parts) {
    return null;
  }

  const fields = { yyyy: 0, MM: 0, dd: 0 } as Record<string, number>;
  tokens.forEach((token, index) => (fields[token] = Number(parts[index + 1])));

  const date = createDate(fields['yyyy'], fields['MM'] - 1, fields['dd']);
  const isRealDate =
    date.getFullYear() === fields['yyyy'] &&
    date.getMonth() === fields['MM'] - 1 &&
    date.getDate() === fields['dd'];
  return isRealDate ? date : null;
}

export function formatDateRange(range: DateRange, format: string): string {
  return `${formatDate(range.start, format)}${DATE_RANGE_SEPARATOR}${formatDate(range.end, format)}`;
}

/** Splits `start – end` (en dash, em dash, hyphen or "to", with spaces around it) into its two halves. */
export function splitDateRangeText(text: string): [string, string] | null {
  const parts = text.trim().split(RANGE_SEPARATOR);
  return parts.length === 2 && parts[0] && parts[1] ? [parts[0], parts[1]] : null;
}

/** `null` unless both halves are real dates; doesn't check that `end` isn't before `start`. */
export function parseDateRange(text: string, format: string): DateRange | null {
  const halves = splitDateRangeText(text);
  if (!halves) {
    return null;
  }
  const start = parseDate(halves[0], format);
  const end = parseDate(halves[1], format);
  return start && end ? { start, end } : null;
}
