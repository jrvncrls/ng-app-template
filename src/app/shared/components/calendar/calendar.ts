import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  LOCALE_ID,
  output,
  signal,
} from '@angular/core';

import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  compareDays,
  endOfMonth,
  formatDate,
  getDateError,
  getMonthGrid,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  WeekStart,
} from '../../utils/date-utils';

export type CalendarMode = 'single' | 'range';

interface CalendarDay {
  date: Date;
  /** `yyyy-MM-dd`, stable across renders so the DOM node is reused. */
  key: string;
  label: number;
  ariaLabel: string;
  outsideMonth: boolean;
  today: boolean;
  disabled: boolean;
  /** The picked date, or either end of the picked range. */
  selected: boolean;
  /** The one cell in the tab order (roving tabindex). */
  active: boolean;
  /** Strictly between the two ends of the range. */
  inRange: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
}

let nextId = 0;

/**
 * A single-month grid used by `date-picker` and `date-range-picker`. It only
 * *displays* a selection (`start`/`end`) and reports clicks via `dateSelected`;
 * what a click means (replace the date, start a range, finish a range) is up
 * to the parent.
 */
@Component({
  selector: 'techyon-calendar',
  standalone: true,
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class Calendar {
  readonly testId = input.required<string>();
  /** `range` previews the span from `start` to the hovered/focused day while `end` is empty. */
  readonly mode = input<CalendarMode>('single');
  readonly start = input<Date | null>(null);
  readonly end = input<Date | null>(null);
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly isDateDisabled = input<((date: Date) => boolean) | undefined>();
  readonly weekStartsOn = input<WeekStart>(0);
  /** The day that is focused (and whose month is shown) to begin with. Defaults to today. */
  readonly initialDate = input<Date | null>(null);
  /** Moves focus onto the active day once rendered — for a calendar opened from a button. */
  readonly focusOnInit = input(false, { transform: booleanAttribute });

  readonly dateSelected = output<Date>();

  private readonly locale = inject(LOCALE_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  private readonly today = startOfDay(new Date());
  protected readonly titleId = `app-calendar-title-${nextId++}`;

  /** The keyboard-focused day; the visible month always follows it. */
  protected readonly activeDate = linkedSignal(() =>
    clampDate(startOfDay(this.initialDate() ?? this.today), this.min(), this.max()),
  );
  private readonly viewMonth = computed(() => startOfMonth(this.activeDate()));
  private readonly hoverDate = signal<Date | null>(null);
  protected readonly dayFocused = signal(false);

  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat(this.locale, { month: 'long', year: 'numeric' }).format(
      this.viewMonth(),
    ),
  );

  protected readonly weekdays = computed(() => {
    const short = new Intl.DateTimeFormat(this.locale, { weekday: 'short' });
    const long = new Intl.DateTimeFormat(this.locale, { weekday: 'long' });
    const sunday = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, index) => {
      const day = addDays(sunday, (this.weekStartsOn() + index) % 7);
      return { short: short.format(day), long: long.format(day) };
    });
  });

  protected readonly nav = computed(() => {
    const view = this.viewMonth();
    const min = this.min();
    const max = this.max();
    const canGoBack = (months: number) =>
      !min || compareDays(endOfMonth(addMonths(view, -months)), min) >= 0;
    const canGoForward = (months: number) =>
      !max || compareDays(startOfMonth(addMonths(view, months)), max) <= 0;
    return {
      previousYear: canGoBack(12),
      previousMonth: canGoBack(1),
      nextMonth: canGoForward(1),
      nextYear: canGoForward(12),
    };
  });

  protected readonly weeks = computed<CalendarDay[][]>(() => {
    const view = this.viewMonth();
    const active = this.activeDate();
    const start = this.start();
    const end = this.end();
    const constraints = {
      min: this.min(),
      max: this.max(),
      isDateDisabled: this.isDateDisabled(),
    };
    const dayFormat = new Intl.DateTimeFormat(this.locale, { dateStyle: 'full' });

    // While a range is half-picked, preview it up to the hovered (or keyboard-
    // focused) day. Focus only counts while a day actually has it — otherwise
    // paging months with the nav buttons would drag the preview along with the
    // active day. A preview that ends before the start would restart the range
    // on click, so it isn't drawn.
    const preview = this.hoverDate() ?? (this.dayFocused() ? active : null);
    const spanEnd =
      end ??
      (this.mode() === 'range' && start && preview && compareDays(preview, start) > 0
        ? preview
        : null);
    const hasSpan =
      this.mode() === 'range' && !!start && !!spanEnd && compareDays(spanEnd, start) > 0;

    return getMonthGrid(view, this.weekStartsOn()).map((week) =>
      week.map((date) => ({
        date,
        key: formatDate(date, 'yyyy-MM-dd'),
        label: date.getDate(),
        ariaLabel: dayFormat.format(date),
        outsideMonth: date.getMonth() !== view.getMonth(),
        today: isSameDay(date, this.today),
        disabled: getDateError(date, constraints) !== null,
        selected: isSameDay(date, start) || isSameDay(date, end),
        active: isSameDay(date, active),
        inRange: hasSpan && compareDays(date, start!) > 0 && compareDays(date, spanEnd!) < 0,
        rangeStart: hasSpan && isSameDay(date, start),
        rangeEnd: hasSpan && isSameDay(date, spanEnd),
      })),
    );
  });

  constructor() {
    afterNextRender(() => {
      if (this.focusOnInit()) {
        this.focusActiveDay();
      }
    });
  }

  protected selectDay(day: CalendarDay): void {
    if (day.disabled) {
      return;
    }
    this.activeDate.set(day.date);
    this.dateSelected.emit(day.date);
  }

  protected hover(day: CalendarDay | null): void {
    if (this.mode() === 'range') {
      this.hoverDate.set(day?.date ?? null);
    }
  }

  /**
   * Moves the visible month without taking focus off the button that was
   * pressed. The nav buttons use `aria-disabled` (not `disabled`) so they keep
   * focus at the min/max edge, which means the guard has to live here.
   */
  protected shiftMonths(months: number, allowed: boolean): void {
    if (allowed) {
      this.activeDate.set(this.clamp(addMonths(this.activeDate(), months)));
    }
  }

  protected handleKeydown(event: KeyboardEvent): void {
    const active = this.activeDate();
    let next: Date;

    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(active, -1);
        break;
      case 'ArrowRight':
        next = addDays(active, 1);
        break;
      case 'ArrowUp':
        next = addDays(active, -7);
        break;
      case 'ArrowDown':
        next = addDays(active, 7);
        break;
      case 'Home':
        next = startOfWeek(active, this.weekStartsOn());
        break;
      case 'End':
        next = addDays(startOfWeek(active, this.weekStartsOn()), 6);
        break;
      case 'PageUp':
        next = event.shiftKey ? addYears(active, -1) : addMonths(active, -1);
        break;
      case 'PageDown':
        next = event.shiftKey ? addYears(active, 1) : addMonths(active, 1);
        break;
      default:
        return;
    }

    event.preventDefault();
    this.activeDate.set(this.clamp(next));
    // The target cell may not exist until the (possibly new) month renders.
    afterNextRender(() => this.focusActiveDay(), { injector: this.injector });
  }

  private clamp(date: Date): Date {
    return clampDate(date, this.min(), this.max());
  }

  private focusActiveDay(): void {
    this.host.nativeElement.querySelector<HTMLElement>('.calendar__day[tabindex="0"]')?.focus();
  }
}
