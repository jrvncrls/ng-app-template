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

export interface MultiSelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-multi-select',
  standalone: true,
  templateUrl: './multi-select.html',
  styleUrl: './multi-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class MultiSelect implements ControlValueAccessor {
  readonly testId = input.required<string>();
  readonly label = input<string>('');
  /** Shows the required marker; also shown automatically when the bound control has `Validators.required`. */
  readonly required = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string>('Select…');
  readonly options = input.required<MultiSelectOption[]>();
  readonly errorMessages = input<Record<string, string>>();

  readonly value = model<string[]>([]);
  protected readonly disabled = signal(false);
  protected readonly touched = signal(false);
  protected readonly open = signal(false);

  protected readonly summary = computed(() => {
    const selected = this.value();
    if (selected.length === 0) {
      return this.placeholder();
    }
    if (selected.length === 1) {
      return this.options().find((option) => option.value === selected[0])?.label ?? selected[0];
    }
    return `${selected.length} selected`;
  });

  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  private onChange: (value: string[]) => void = () => {};
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

  protected togglePanel(): void {
    if (this.disabled()) {
      return;
    }
    this.open.update((isOpen) => !isOpen);
    if (!this.open()) {
      this.markTouched();
    }
  }

  protected isSelected(optionValue: string): boolean {
    return this.value().includes(optionValue);
  }

  protected toggleOption(optionValue: string): void {
    const current = this.value();
    this.value.set(
      current.includes(optionValue)
        ? current.filter((value) => value !== optionValue)
        : [...current, optionValue],
    );
  }

  protected markTouched(): void {
    this.touched.set(true);
    this.onTouchedFn();
  }

  protected isRequired(): boolean {
    return this.required() || isControlRequired(this.ngControl?.control);
  }

  writeValue(value: string[]): void {
    this.value.set(value ?? []);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
