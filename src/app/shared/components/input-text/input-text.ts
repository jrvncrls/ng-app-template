import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

import { resolveErrorMessage } from '../../utils/control-error-messages';
import { isControlRequired } from '../../utils/control-required';

export type InputTextType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';

@Component({
  selector: 'app-input-text',
  standalone: true,
  templateUrl: './input-text.html',
  styleUrl: './input-text.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class InputText implements ControlValueAccessor {
  readonly testId = input.required<string>();
  readonly label = input<string>('');
  /** Shows the required marker; also shown automatically when the bound control has `Validators.required`. */
  readonly required = input(false, { transform: booleanAttribute });
  readonly type = input<InputTextType>('text');
  readonly placeholder = input<string>('');
  /** Overrides for the default required/minlength/maxlength/pattern/email messages. */
  readonly errorMessages = input<Record<string, string>>();

  // Source of truth for the value, whether driven by [(value)] or a bound form control.
  readonly value = model<string>('');
  protected readonly disabled = signal(false);
  protected readonly touched = signal(false);

  // @Self() so this only ever picks up an NgControl on this exact host element
  // (formControlName / [formControl] / ngModel), never an ancestor's.
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  private onChange: (value: string) => void = () => {};
  private onTouchedFn: () => void = () => {};

  protected readonly errorMessage = computed(() => {
    // Read so a value change (which re-runs sync validators) re-evaluates this.
    this.value();
    if (!this.touched()) {
      return null;
    }
    return resolveErrorMessage(this.ngControl?.control?.errors, this.errorMessages());
  });

  constructor() {
    // Wired manually (rather than via a static NG_VALUE_ACCESSOR provider)
    // because combining that provider with the @Self() NgControl injection
    // above causes an NG0200 circular-dependency error — Angular tries to
    // resolve NG_VALUE_ACCESSOR to build the NgControl this class also
    // depends on. This is the same pattern Angular Material's custom form
    // controls use.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    effect(() => {
      this.onChange(this.value());
    });
  }

  protected handleInput(value: string): void {
    this.value.set(value);
  }

  protected handleBlur(): void {
    this.touched.set(true);
    this.onTouchedFn();
  }

  protected isRequired(): boolean {
    return this.required() || isControlRequired(this.ngControl?.control);
  }

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
