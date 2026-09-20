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

export interface AutocompleteOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  templateUrl: './autocomplete.html',
  styleUrl: './autocomplete.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class Autocomplete implements ControlValueAccessor {
  readonly testId = input.required<string>();
  readonly label = input<string>('');
  /** Shows the required marker; also shown automatically when the bound control has `Validators.required`. */
  readonly required = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string>('');
  readonly options = input.required<AutocompleteOption[]>();
  readonly errorMessages = input<Record<string, string>>();

  readonly value = model<string>('');
  protected readonly disabled = signal(false);
  protected readonly touched = signal(false);
  protected readonly open = signal(false);

  protected readonly filteredOptions = computed(() => {
    const query = this.value().trim().toLowerCase();
    if (!query) {
      return this.options();
    }
    return this.options().filter((option) => option.label.toLowerCase().includes(query));
  });

  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  private onChange: (value: string) => void = () => {};
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

  protected handleInput(value: string): void {
    this.value.set(value);
    this.open.set(true);
  }

  protected handleFocus(): void {
    this.open.set(true);
  }

  protected handleBlur(): void {
    this.open.set(false);
    this.touched.set(true);
    this.onTouchedFn();
  }

  // Fires before the input's (blur), so a suggestion click still registers.
  protected selectOption(option: AutocompleteOption): void {
    this.value.set(option.value);
    this.open.set(false);
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
