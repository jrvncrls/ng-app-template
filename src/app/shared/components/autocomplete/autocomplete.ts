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
  untracked,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

import { resolveErrorMessage } from '../../utils/control-error-messages';
import { isControlRequired } from '../../utils/control-required';
import { DROPDOWN_POSITIONS } from '../../utils/dropdown-positions';

export interface AutocompleteOption {
  label: string;
  value: string;
}

let nextId = 0;

@Component({
  selector: 'techyon-autocomplete',
  standalone: true,
  imports: [CdkConnectedOverlay, CdkOverlayOrigin],
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
  /** Shows an (x) button that empties the text while there is any. */
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input<string>('Clear');
  readonly errorMessages = input<Record<string, string>>();

  /**
   * The bound value: the picked option's `value`, or the raw text when the user
   * types something that isn't (yet) a pick. What the input *shows* is `query`.
   */
  readonly value = model<string>('');
  protected readonly disabled = signal(false);
  protected readonly touched = signal(false);
  protected readonly open = signal(false);
  /** Text shown in the input — the picked option's label, or whatever the user typed. */
  protected readonly query = signal('');
  /** Keyboard-highlighted suggestion; `-1` until the user arrows into the list. */
  protected readonly activeIndex = signal(-1);

  private readonly uid = nextId++;
  protected readonly inputId = `app-autocomplete-input-${this.uid}`;
  protected readonly listboxId = `app-autocomplete-listbox-${this.uid}`;
  protected readonly optionId = (index: number) => `app-autocomplete-option-${this.uid}-${index}`;

  protected readonly filteredOptions = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (!query) {
      return this.options();
    }
    return this.options().filter((option) => option.label.toLowerCase().includes(query));
  });

  protected readonly showPanel = computed(() => this.open() && this.filteredOptions().length > 0);

  protected readonly showClear = computed(
    () => this.clearable() && this.value() !== '' && !this.disabled(),
  );

  protected readonly positions = DROPDOWN_POSITIONS;

  // True while the user is editing the text, so the sync effect below doesn't
  // replace what they're typing with a label.
  private typing = false;

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('input');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
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

    // Keep the displayed text in step with the value (writeValue, a parent's
    // `[(value)]`, or options that load after the value was set).
    effect(() => {
      const label = this.labelFor(this.value());
      if (!untracked(() => this.typing)) {
        this.query.set(label);
      }
    });

    // Keep the keyboard-highlighted option visible inside the scrollable panel.
    afterRenderEffect(() => {
      const index = this.activeIndex();
      if (!this.showPanel() || index < 0) {
        return;
      }
      // The panel renders in the CDK overlay container, outside the host element.
      this.document.getElementById(this.optionId(index))?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  protected handleInput(text: string): void {
    this.typing = true;
    this.query.set(text);
    this.value.set(text);
    this.activeIndex.set(-1);
    this.open.set(true);
  }

  protected handleFocus(): void {
    this.open.set(true);
  }

  // Clicking the field again reopens a panel dismissed with Escape.
  protected handleClick(): void {
    this.open.set(true);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    const lastIndex = this.filteredOptions().length - 1;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.open()) {
          this.open.set(true);
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
        if (this.showPanel() && active) {
          event.preventDefault();
          this.selectOption(active);
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
    this.typing = false;
    this.open.set(false);
    this.activeIndex.set(-1);
    this.touched.set(true);
    this.onTouchedFn();
  }

  protected clear(): void {
    this.typing = false;
    this.query.set('');
    this.value.set('');
    this.activeIndex.set(-1);
    this.inputEl()?.nativeElement.focus();
  }

  // The panel's mousedown is default-prevented, so the input keeps focus and
  // its `focusout` doesn't fire before this click registers.
  protected selectOption(option: AutocompleteOption): void {
    this.typing = false;
    this.query.set(option.label);
    this.value.set(option.value);
    this.activeIndex.set(-1);
    this.open.set(false);
  }

  protected isRequired(): boolean {
    return this.required() || isControlRequired(this.ngControl?.control);
  }

  private labelFor(value: string): string {
    return this.options().find((option) => option.value === value)?.label ?? value;
  }

  writeValue(value: string): void {
    this.typing = false;
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
