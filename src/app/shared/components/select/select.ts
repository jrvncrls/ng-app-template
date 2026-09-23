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

export interface SelectOption {
  label: string;
  value: string;
}

let nextId = 0;

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CdkConnectedOverlay, CdkOverlayOrigin],
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
  /** Shows the required marker; also shown automatically when the bound control has `Validators.required`. */
  readonly required = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string>('Select…');
  readonly options = input.required<SelectOption[]>();
  /** Shows an (x) button that resets the value to `null` while something is selected. */
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input<string>('Clear selection');
  readonly errorMessages = input<Record<string, string>>();

  readonly value = model<string | null>(null);
  protected readonly disabled = signal(false);
  protected readonly touched = signal(false);
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);

  private readonly uid = nextId++;
  protected readonly labelId = `app-select-label-${this.uid}`;
  protected readonly listboxId = `app-select-listbox-${this.uid}`;
  protected readonly optionId = (index: number) => `app-select-option-${this.uid}-${index}`;

  protected readonly selectedOption = computed(
    () => this.options().find((option) => option.value === this.value()) ?? null,
  );

  protected readonly showClear = computed(
    () => this.clearable() && this.value() !== null && !this.disabled(),
  );

  protected readonly positions = DROPDOWN_POSITIONS;

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
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

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }
    if (this.open()) {
      this.close();
    } else {
      this.openPanel();
    }
  }

  protected clear(): void {
    this.value.set(null);
    this.close();
    this.trigger()?.nativeElement.focus();
  }

  protected selectOption(option: SelectOption): void {
    this.value.set(option.value);
    this.close();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    const lastIndex = this.options().length - 1;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.open()) {
          this.openPanel();
          return;
        }
        const step = event.key === 'ArrowDown' ? 1 : -1;
        this.activeIndex.update((index) => Math.min(Math.max(index + step, 0), lastIndex));
        break;
      }
      case 'Home':
      case 'End':
        if (this.open()) {
          event.preventDefault();
          this.activeIndex.set(event.key === 'Home' ? 0 : lastIndex);
        }
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const active = this.options()[this.activeIndex()];
        if (this.open() && active) {
          this.selectOption(active);
        } else {
          this.toggle();
        }
        break;
      }
      case 'Backspace':
      case 'Delete':
        if (this.showClear()) {
          event.preventDefault();
          this.value.set(null);
        }
        break;
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          this.close();
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
    this.markTouched();
  }

  /** The overlay also reports clicks on the trigger itself; let `toggle()` own those. */
  protected handleOutsideClick(event: MouseEvent): void {
    if (this.host.nativeElement.contains(event.target as Node)) {
      return;
    }
    this.open.set(false);
    this.markTouched();
  }

  private openPanel(): void {
    const selectedIndex = this.options().findIndex((option) => option.value === this.value());
    this.activeIndex.set(selectedIndex >= 0 ? selectedIndex : 0);
    this.open.set(true);
  }

  private close(): void {
    this.open.set(false);
  }

  private markTouched(): void {
    this.touched.set(true);
    this.onTouchedFn();
  }

  protected isRequired(): boolean {
    return this.required() || isControlRequired(this.ngControl?.control);
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
