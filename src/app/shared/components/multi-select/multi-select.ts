import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';
import {
  afterRenderEffect,
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
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

import { resolveErrorMessage } from '../../utils/control-error-messages';
import { isControlRequired } from '../../utils/control-required';
import { DROPDOWN_POSITIONS } from '../../utils/dropdown-positions';

export interface MultiSelectOption {
  label: string;
  value: string;
}

let nextId = 0;

@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [CdkConnectedOverlay, CdkOverlayOrigin],
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
  /** Shows an (x) button that empties the selection while anything is selected. */
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input<string>('Clear all');
  /** Prefix for each chip's remove button label, e.g. "Remove Angular". */
  readonly removeLabel = input<string>('Remove');
  readonly noResultsText = input<string>('No items found');
  readonly errorMessages = input<Record<string, string>>();

  readonly value = model<string[]>([]);
  protected readonly disabled = signal(false);
  protected readonly touched = signal(false);
  protected readonly open = signal(false);
  protected readonly search = signal('');
  protected readonly activeIndex = signal(-1);

  private readonly uid = nextId++;
  protected readonly inputId = `app-multi-select-input-${this.uid}`;
  protected readonly listboxId = `app-multi-select-listbox-${this.uid}`;
  protected readonly optionId = (index: number) => `app-multi-select-option-${this.uid}-${index}`;

  protected readonly selectedOptions = computed(() =>
    this.value().map(
      (value) => this.options().find((option) => option.value === value) ?? { label: value, value },
    ),
  );

  protected readonly filteredOptions = computed(() => {
    const query = this.search().trim().toLowerCase();
    if (!query) {
      return this.options();
    }
    return this.options().filter((option) => option.label.toLowerCase().includes(query));
  });

  protected readonly showClear = computed(
    () => this.clearable() && this.value().length > 0 && !this.disabled(),
  );

  protected readonly positions = DROPDOWN_POSITIONS;

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('input');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
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

    // Keep the keyboard-highlighted option visible inside the scrollable panel.
    afterRenderEffect(() => {
      const index = this.activeIndex();
      if (!this.open() || index < 0) {
        return;
      }
      // The panel renders in the CDK overlay container, outside the host element.
      this.document.getElementById(this.optionId(index))?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  /** Clicking anywhere on the control focuses the search input and opens the panel. */
  protected handleControlClick(event: MouseEvent): void {
    if (this.disabled()) {
      return;
    }
    const onChevron = (event.target as HTMLElement).closest('.multi-select__chevron');
    if (onChevron && this.open()) {
      this.open.set(false);
      return;
    }
    this.inputEl()?.nativeElement.focus();
    this.openPanel();
  }

  protected handleInput(value: string): void {
    this.search.set(value);
    this.activeIndex.set(this.filteredOptions().length > 0 ? 0 : -1);
    this.open.set(true);
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
    // Stays open so several options can be picked in a row; the search starts over.
    this.search.set('');
    this.activeIndex.set(this.options().findIndex((option) => option.value === optionValue));
  }

  protected removeOption(optionValue: string): void {
    if (this.disabled()) {
      return;
    }
    this.value.update((current) => current.filter((value) => value !== optionValue));
  }

  protected clear(): void {
    this.value.set([]);
    this.search.set('');
    this.inputEl()?.nativeElement.focus();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    const lastIndex = this.filteredOptions().length - 1;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.open()) {
          this.openPanel();
          return;
        }
        const step = event.key === 'ArrowDown' ? 1 : -1;
        this.activeIndex.update((index) => {
          if (index < 0) {
            return step === 1 ? 0 : lastIndex;
          }
          return Math.min(Math.max(index + step, 0), lastIndex);
        });
        break;
      }
      case 'Enter': {
        const active = this.filteredOptions()[this.activeIndex()];
        if (this.open() && active) {
          event.preventDefault();
          this.toggleOption(active.value);
        }
        break;
      }
      case 'Backspace': {
        // Like a tag input: with nothing typed, Backspace drops the last chip.
        const current = this.value();
        if (this.search() === '' && current.length > 0) {
          event.preventDefault();
          this.removeOption(current[current.length - 1]);
        }
        break;
      }
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          this.open.set(false);
        }
        break;
    }
  }

  protected handleFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) {
      return;
    }
    this.open.set(false);
    this.search.set('');
    this.markTouched();
  }

  protected isRequired(): boolean {
    return this.required() || isControlRequired(this.ngControl?.control);
  }

  private openPanel(): void {
    if (!this.open()) {
      this.activeIndex.set(this.filteredOptions().length > 0 ? 0 : -1);
      this.open.set(true);
    }
  }

  private markTouched(): void {
    this.touched.set(true);
    this.onTouchedFn();
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
