import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

import { resolveErrorMessage } from '../../utils/control-error-messages';
import { isControlRequired } from '../../utils/control-required';
import {
  clampDate,
  formatDate,
  getDateError,
  isSameDay,
  isValidDate,
  parseDate,
  startOfDay,
  WeekStart,
} from '../../utils/date-utils';
import { DROPDOWN_POSITIONS } from '../../utils/dropdown-positions';
import { Button } from '../button/button';
import { Calendar } from '../calendar/calendar';

let nextId = 0;

@Component({
  selector: 'techyon-date-picker',
  standalone: true,
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus, Button, Calendar],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class DatePicker implements ControlValueAccessor {
  readonly testId = input.required<string>();
  readonly label = input<string>('');
  /** Shows the required marker; also shown automatically when the bound control has `Validators.required`. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Defaults to the upper-cased `format`, e.g. `MM/DD/YYYY`. */
  readonly placeholder = input<string>();
  /**
   * How the date is shown and typed, built from `yyyy`, `MM` and `dd` in any
   * order (`'MM/dd/yyyy'`, `'dd.MM.yyyy'`, `'yyyy-MM-dd'`).
   */
  readonly format = input<string>('MM/dd/yyyy');
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  /** Return `true` for a day that must not be selectable (e.g. weekends, holidays). */
  readonly isDateDisabled = input<(date: Date) => boolean>();
  readonly weekStartsOn = input<WeekStart>(0);
  /** Overrides for the default required/invalidDate/minDate/maxDate/disabledDate messages. */
  readonly errorMessages = input<Record<string, string>>();

  /** A `Date` at local midnight, or `null` while nothing is picked. */
  readonly value = model<Date | null>(null);
  protected readonly disabled = signal(false);
  protected readonly touched = signal(false);
  protected readonly open = signal(false);
  /** What the user has typed; only turned into `value` on blur / Enter / opening the calendar. */
  protected readonly text = signal('');
  /** Set when the typed text couldn't be used, so it can be explained instead of silently dropped. */
  protected readonly parseError = signal<string | null>(null);
  /** Which day the calendar focuses when it opens. */
  protected readonly calendarStart = signal<Date>(startOfDay(new Date()));

  private readonly uid = nextId++;
  protected readonly inputId = `app-date-picker-input-${this.uid}`;
  protected readonly panelId = `app-date-picker-panel-${this.uid}`;
  protected readonly errorId = `app-date-picker-error-${this.uid}`;

  protected readonly positions = DROPDOWN_POSITIONS;

  private readonly toggleButton = viewChild<ElementRef<HTMLButtonElement>>('toggleButton');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  private onChange: (value: Date | null) => void = () => {};
  private onTouchedFn: () => void = () => {};

  private readonly constraints = computed(() => ({
    min: this.min(),
    max: this.max(),
    isDateDisabled: this.isDateDisabled(),
  }));

  protected readonly resolvedPlaceholder = computed(
    () => this.placeholder() ?? this.format().toUpperCase(),
  );

  protected readonly todayDisabled = computed(
    () => getDateError(startOfDay(new Date()), this.constraints()) !== null,
  );

  protected readonly errorMessage = computed(() => {
    // Read so a value change (which re-runs sync validators) re-evaluates this.
    this.value();
    if (!this.touched()) {
      return null;
    }
    const parseError = this.parseError();
    if (parseError) {
      return resolveErrorMessage({ [parseError]: true }, this.errorMessages());
    }
    return resolveErrorMessage(this.ngControl?.control?.errors, this.errorMessages());
  });

  constructor() {
    // See InputText for why this is wired manually instead of via a static
    // NG_VALUE_ACCESSOR provider.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    effect(() => {
      this.onChange(this.value());
    });

    // Keep the text in step with a value that was set from outside (a form
    // control, `[(value)]`, the calendar). Text that already means the same
    // thing is left alone, and so is text we rejected ourselves (the value was
    // dropped to `null` because of `parseError`) — the user's typo has to stay
    // put next to its error message.
    effect(() => {
      const value = this.value();
      const format = this.format();
      untracked(() => {
        if (value === null && this.parseError()) {
          return;
        }
        if (!isSameDay(parseDate(this.text(), format), value)) {
          this.parseError.set(null);
          this.text.set(value ? formatDate(value, format) : '');
        }
      });
    });
  }

  protected handleInput(text: string): void {
    this.text.set(text);
  }

  protected handleInputBlur(): void {
    // Opening the calendar moves focus into it; the text was committed before that.
    if (!this.open()) {
      this.commitText();
    }
  }

  protected handleInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.openPanel();
    } else if (event.key === 'Enter') {
      const before = this.value();
      this.commitText();
      // The first Enter applies what was typed; only a second one submits a surrounding form.
      if (!isSameDay(before, this.value()) || this.parseError()) {
        event.preventDefault();
      }
    }
  }

  protected handleFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    // Moving between the input and the calendar button, or into the calendar.
    if ((next && this.host.nativeElement.contains(next)) || this.open()) {
      return;
    }
    this.markTouched();
  }

  /** The overlay also reports clicks on the field itself; let the field own those. */
  protected handleOutsideClick(event: MouseEvent): void {
    if (this.host.nativeElement.contains(event.target as Node)) {
      return;
    }
    this.open.set(false);
    this.markTouched();
  }

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }
    if (this.open()) {
      this.open.set(false);
    } else {
      this.openPanel();
    }
  }

  protected handlePanelEscape(event: Event): void {
    event.preventDefault();
    // Not the modal (or anything else) behind this popup.
    event.stopPropagation();
    this.closeAndRefocus();
  }

  protected selectDate(date: Date): void {
    this.setValue(date);
    this.closeAndRefocus();
  }

  protected selectToday(): void {
    this.selectDate(startOfDay(new Date()));
  }

  protected clear(): void {
    this.setValue(null);
    this.closeAndRefocus();
  }

  private openPanel(): void {
    this.commitText();
    const start = this.value() ?? startOfDay(new Date());
    this.calendarStart.set(clampDate(start, this.min(), this.max()));
    this.open.set(true);
  }

  private closeAndRefocus(): void {
    this.open.set(false);
    this.toggleButton()?.nativeElement.focus();
  }

  private setValue(date: Date | null): void {
    this.parseError.set(null);
    if (!isSameDay(date, this.value())) {
      this.value.set(date);
    }
    this.text.set(date ? formatDate(date, this.format()) : '');
  }

  /** Turns the typed text into `value`, or explains why it can't. */
  private commitText(): void {
    const text = this.text();
    if (!text.trim()) {
      this.setValue(null);
      return;
    }

    const date = parseDate(text, this.format());
    const error = date ? getDateError(date, this.constraints()) : 'invalidDate';
    if (date && !error) {
      this.setValue(date);
      return;
    }

    // Drop the value so the form doesn't keep holding a date the field no
    // longer shows, but keep the text so the user can correct it.
    this.parseError.set(error);
    this.value.set(null);
    this.markTouched();
  }

  private markTouched(): void {
    this.touched.set(true);
    this.onTouchedFn();
  }

  protected isRequired(): boolean {
    return this.required() || isControlRequired(this.ngControl?.control);
  }

  writeValue(value: Date | null): void {
    const date = isValidDate(value) ? value : null;
    // Reset the text explicitly too: the effect keeps unusable text while the
    // value stays `null`, but a form reset should wipe it.
    this.parseError.set(null);
    this.value.set(date);
    this.text.set(date ? formatDate(date, this.format()) : '');
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
