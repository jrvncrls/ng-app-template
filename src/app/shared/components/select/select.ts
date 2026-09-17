import {
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

export interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class Select implements ControlValueAccessor {
  readonly testId = input.required<string>();
  readonly label = input<string>('');
  readonly placeholder = input<string>('Select…');
  readonly options = input.required<SelectOption[]>();
  readonly errorMessages = input<Record<string, string>>();

  readonly value = model<string | null>(null);
  protected readonly disabled = signal(false);
  protected readonly touched = signal(false);

  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  private onChange: (value: string | null) => void = () => {};
  private onTouchedFn: () => void = () => {};

  protected readonly errorMessage = computed(() => {
    this.value();
    if (!this.touched()) {
      return null;
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
  }

  protected handleChange(value: string): void {
    this.value.set(value || null);
  }

  protected handleBlur(): void {
    this.touched.set(true);
    this.onTouchedFn();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
