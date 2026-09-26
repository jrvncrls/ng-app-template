import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { DatePicker } from './date-picker';

const SEPT_24 = new Date(2026, 8, 24);

// Same shape as the InputText reference spec — standalone `[(value)]` usage,
// the ControlValueAccessor surface, and a real `[formControl]` host — plus the
// calendar popup, which renders in the CDK overlay container (outside the
// component's own element).
describe('DatePicker', () => {
  let fixture: ComponentFixture<DatePicker>;
  let component: DatePicker;
  let el: HTMLElement;

  const input = () => el.querySelector<HTMLInputElement>('input')!;
  const toggle = () => el.querySelector<HTMLButtonElement>('.date-field__toggle')!;
  const panel = () => document.querySelector<HTMLElement>('.date-field__panel');
  const day = (key: string) => document.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)!;
  const error = () => el.querySelector('.date-field__error')?.textContent?.trim() ?? null;

  const type = (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input'));
  };
  const blur = () => {
    input().dispatchEvent(new Event('blur'));
    input().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();
  };
  const typeAndBlur = (text: string) => {
    type(text);
    blur();
  };
  const openPanel = () => {
    toggle().click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePicker],
    }).compileComponents();

    fixture = TestBed.createComponent(DatePicker);
    fixture.componentRef.setInput('testId', 'stub-date-picker');
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    // Attached to the app so after-render hooks (the calendar focusing itself)
    // run after the fixture has rendered, as in a real app.
    fixture.autoDetectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('standalone usage', () => {
    it('shows the format as the placeholder unless one is given', () => {
      expect(input().placeholder).toBe('MM/DD/YYYY');

      fixture.componentRef.setInput('format', 'dd.MM.yyyy');
      fixture.detectChanges();
      expect(input().placeholder).toBe('DD.MM.YYYY');

      fixture.componentRef.setInput('placeholder', 'Pick a day');
      fixture.detectChanges();
      expect(input().placeholder).toBe('Pick a day');
    });

    it('shows a value set from outside in the configured format', () => {
      component.value.set(new Date(2026, 0, 2));
      fixture.detectChanges();
      expect(input().value).toBe('01/02/2026');

      fixture.componentRef.setInput('format', 'yyyy-MM-dd');
      fixture.detectChanges();
      expect(input().value).toBe('2026-01-02');
    });

    it('turns typed text into the value on blur, not on every keystroke', () => {
      type('09/24/2026');
      expect(component.value()).toBeNull();

      blur();
      expect(component.value()).toEqual(SEPT_24);
      expect(input().value).toBe('09/24/2026');
    });

    it('normalises what was typed to the configured format', () => {
      typeAndBlur('9-4-2026');
      expect(component.value()).toEqual(new Date(2026, 8, 4));
      expect(input().value).toBe('09/04/2026');
    });

    it('applies typed text on Enter, and only a second Enter is left to submit a form', () => {
      type('09/24/2026');
      const first = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      input().dispatchEvent(first);
      expect(component.value()).toEqual(SEPT_24);
      expect(first.defaultPrevented).toBe(true);

      const second = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      input().dispatchEvent(second);
      expect(second.defaultPrevented).toBe(false);
    });

    it('clears the value when the text is emptied', () => {
      component.value.set(SEPT_24);
      fixture.detectChanges();

      typeAndBlur('');

      expect(component.value()).toBeNull();
      expect(error()).toBeNull();
    });

    it('explains unusable text, keeps it for correction, and drops the value', () => {
      component.value.set(SEPT_24);
      fixture.detectChanges();

      typeAndBlur('13/45/2026');

      expect(component.value()).toBeNull();
      expect(input().value).toBe('13/45/2026');
      expect(error()).toBe('Please enter a valid date.');
      expect(input().getAttribute('aria-invalid')).toBe('true');
      expect(input().getAttribute('aria-describedby')).toBe(
        el.querySelector('.date-field__error')!.id,
      );
    });

    it('keeps a rejected date in the field next to its error, even when it replaces a valid value', () => {
      fixture.componentRef.setInput('min', new Date(2026, 8, 10));
      component.value.set(SEPT_24);
      fixture.detectChanges();

      typeAndBlur('09/09/2026');
      fixture.detectChanges();

      expect(component.value()).toBeNull();
      expect(input().value).toBe('09/09/2026');
      expect(error()).toBe('This date is too early.');
    });

    it('takes a value set from outside over a leftover error', () => {
      typeAndBlur('nope');
      expect(error()).not.toBeNull();

      component.value.set(SEPT_24);
      fixture.detectChanges();

      expect(input().value).toBe('09/24/2026');
      expect(error()).toBeNull();
    });

    it('recovers once the text is corrected', () => {
      typeAndBlur('nope');
      expect(error()).not.toBeNull();

      typeAndBlur('09/24/2026');
      expect(component.value()).toEqual(SEPT_24);
      expect(error()).toBeNull();
    });

    it('rejects typed dates outside min / max or matched by isDateDisabled', () => {
      fixture.componentRef.setInput('min', new Date(2026, 8, 10));
      fixture.componentRef.setInput('max', new Date(2026, 8, 20));
      fixture.componentRef.setInput('isDateDisabled', (date: Date) => date.getDay() === 0);
      fixture.detectChanges();

      typeAndBlur('09/09/2026');
      expect(error()).toBe('This date is too early.');
      expect(component.value()).toBeNull();

      typeAndBlur('09/21/2026');
      expect(error()).toBe('This date is too late.');

      typeAndBlur('09/13/2026'); // a Sunday
      expect(error()).toBe('This date is not available.');

      typeAndBlur('09/15/2026');
      expect(error()).toBeNull();
      expect(component.value()).toEqual(new Date(2026, 8, 15));
    });

    it('prefers custom messages from errorMessages', () => {
      fixture.componentRef.setInput('errorMessages', { invalidDate: 'Use MM/DD/YYYY.' });
      fixture.detectChanges();

      typeAndBlur('nope');

      expect(error()).toBe('Use MM/DD/YYYY.');
    });
  });

  describe('calendar popup', () => {
    beforeEach(() => {
      component.value.set(SEPT_24);
      fixture.detectChanges();
    });

    it('opens from the calendar button as a dialog on the current value', () => {
      expect(panel()).toBeNull();
      expect(toggle().getAttribute('aria-expanded')).toBe('false');

      openPanel();

      expect(panel()).not.toBeNull();
      expect(panel()!.getAttribute('role')).toBe('dialog');
      expect(toggle().getAttribute('aria-expanded')).toBe('true');
      expect(document.querySelector('.calendar__title')!.textContent).toContain('September 2026');
      expect(day('2026-09-24').classList).toContain('calendar__day--selected');
    });

    it('moves focus onto the selected day', () => {
      openPanel();
      expect(document.activeElement).toBe(day('2026-09-24'));
    });

    it('does not mark the field touched just because the calendar took focus', () => {
      openPanel();
      // The input loses focus to the calendar while the popup is open.
      input().dispatchEvent(new Event('blur'));
      input().dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: day('2026-09-24') }),
      );
      fixture.detectChanges();

      expect(component['touched']()).toBe(false);
    });

    it('selects a day, closes, formats the text and returns focus to the button', () => {
      openPanel();
      day('2026-09-10').click();
      fixture.detectChanges();

      expect(component.value()).toEqual(new Date(2026, 8, 10));
      expect(input().value).toBe('09/10/2026');
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(toggle());
    });

    it('closes on Escape without changing the value and returns focus to the button', () => {
      openPanel();
      day('2026-09-24').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      fixture.detectChanges();

      expect(panel()).toBeNull();
      expect(component.value()).toEqual(SEPT_24);
      expect(document.activeElement).toBe(toggle());
    });

    it('does not let Escape reach anything behind the popup', () => {
      const behind = vi.fn();
      document.body.addEventListener('keydown', behind);
      openPanel();

      day('2026-09-24').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );

      expect(behind).not.toHaveBeenCalled();
      document.body.removeEventListener('keydown', behind);
    });

    it('closes when clicking outside and marks the field touched', () => {
      openPanel();
      document.body.click();
      fixture.detectChanges();

      expect(panel()).toBeNull();
      expect(component['touched']()).toBe(true);
    });

    it('closes when the button is clicked again', () => {
      openPanel();
      toggle().click();
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });

    it('opens with Alt+ArrowDown from the input', () => {
      input().dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true }),
      );
      fixture.detectChanges();
      expect(panel()).not.toBeNull();
    });

    it('applies unsaved typed text before opening on it', () => {
      type('03/15/2027');
      openPanel();

      expect(component.value()).toEqual(new Date(2027, 2, 15));
      expect(document.querySelector('.calendar__title')!.textContent).toContain('March 2027');
    });

    it('opens on the closest allowed month when there is no value', () => {
      component.value.set(null);
      fixture.componentRef.setInput('min', new Date(2027, 4, 5));
      fixture.detectChanges();

      openPanel();

      expect(document.querySelector('.calendar__title')!.textContent).toContain('May 2027');
    });

    it('passes min, max, disabled dates and the week start to the calendar', () => {
      fixture.componentRef.setInput('min', new Date(2026, 8, 10));
      fixture.componentRef.setInput('isDateDisabled', (date: Date) => date.getDay() === 6);
      fixture.componentRef.setInput('weekStartsOn', 1);
      fixture.detectChanges();
      openPanel();

      expect(day('2026-09-09').getAttribute('aria-disabled')).toBe('true');
      expect(day('2026-09-12').getAttribute('aria-disabled')).toBe('true'); // a Saturday
      expect(day('2026-09-15').hasAttribute('aria-disabled')).toBe(false);
      expect(document.querySelector('.calendar__day')!.getAttribute('data-date')).toBe(
        '2026-08-31',
      );
    });

    it('offers Today and Clear', () => {
      openPanel();
      document.querySelector<HTMLElement>('[data-testid="stub-date-picker-clear"]')!.click();
      fixture.detectChanges();
      expect(component.value()).toBeNull();
      expect(input().value).toBe('');
      expect(panel()).toBeNull();

      openPanel();
      document.querySelector<HTMLElement>('[data-testid="stub-date-picker-today"]')!.click();
      fixture.detectChanges();
      const now = new Date();
      expect(component.value()).toEqual(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    });

    it('disables Today when today is not selectable, and Clear when there is no value', () => {
      fixture.componentRef.setInput('max', new Date(2000, 0, 1));
      component.value.set(null);
      fixture.detectChanges();
      openPanel();

      const button = (name: string) =>
        document
          .querySelector(`[data-testid="stub-date-picker-${name}"]`)!
          .querySelector('button')!;
      expect(button('today').disabled).toBe(true);
      expect(button('clear').disabled).toBe(true);
    });

    it('does not open while disabled', () => {
      component.setDisabledState(true);
      fixture.detectChanges();

      toggle().click();
      fixture.detectChanges();

      expect(panel()).toBeNull();
    });
  });

  describe('ControlValueAccessor', () => {
    it('writeValue sets the value signal and the text', () => {
      component.writeValue(SEPT_24);
      fixture.detectChanges();

      expect(component.value()).toEqual(SEPT_24);
      expect(input().value).toBe('09/24/2026');
    });

    it('writeValue treats null, undefined and Invalid Date as empty', () => {
      component.writeValue(SEPT_24);
      for (const empty of [null, undefined, new Date('nope')]) {
        component.writeValue(SEPT_24);
        component.writeValue(empty as Date | null);
        fixture.detectChanges();
        expect(component.value()).toBeNull();
        expect(input().value).toBe('');
      }
    });

    it('writeValue(null) also wipes unusable typed text (form reset)', () => {
      typeAndBlur('nope');
      expect(input().value).toBe('nope');

      component.writeValue(null);
      fixture.detectChanges();

      expect(input().value).toBe('');
      expect(error()).toBeNull();
    });

    it('calls the registered onChange callback whenever the value signal changes', () => {
      const onChange = vi.fn();
      component.registerOnChange(onChange);

      component.value.set(SEPT_24);
      fixture.detectChanges();

      expect(onChange).toHaveBeenCalledWith(SEPT_24);
    });

    it('calls the registered onTouched callback when focus leaves the field', () => {
      const onTouched = vi.fn();
      component.registerOnTouched(onTouched);

      blur();

      expect(onTouched).toHaveBeenCalled();
    });

    it('does not mark touched when focus only moves to the calendar button', () => {
      const onTouched = vi.fn();
      component.registerOnTouched(onTouched);

      input().dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: toggle() }));

      expect(onTouched).not.toHaveBeenCalled();
    });

    it('disables the input and the button via setDisabledState', () => {
      component.setDisabledState(true);
      fixture.detectChanges();

      expect(input().disabled).toBe(true);
      expect(toggle().disabled).toBe(true);
    });
  });

  describe('required marker', () => {
    @Component({
      standalone: true,
      imports: [DatePicker, ReactiveFormsModule],
      template: `
        <techyon-date-picker testId="required" label="Start" [formControl]="requiredControl" />
        <techyon-date-picker testId="optional" label="End" [formControl]="optionalControl" />
      `,
    })
    class HostComponent {
      readonly requiredControl = new FormControl<Date | null>(null, Validators.required);
      readonly optionalControl = new FormControl<Date | null>(null);
    }

    it('shows a red asterisk only when the bound control is required', () => {
      const host = TestBed.createComponent(HostComponent);
      host.detectChanges();

      const [requiredField, optionalField] =
        host.nativeElement.querySelectorAll('techyon-date-picker');
      expect(requiredField.querySelector('.text-error')?.textContent).toBe('*');
      expect(requiredField.querySelector('input').getAttribute('aria-required')).toBe('true');
      expect(optionalField.querySelector('.text-error')).toBeNull();
      expect(optionalField.querySelector('input').hasAttribute('aria-required')).toBe(false);
    });

    it('labels the input', () => {
      const host = TestBed.createComponent(HostComponent);
      host.detectChanges();

      const label: HTMLLabelElement = host.nativeElement.querySelector('label');
      expect(label.htmlFor).toBe(host.nativeElement.querySelector('input').id);
    });
  });

  describe('reactive forms integration', () => {
    @Component({
      standalone: true,
      imports: [DatePicker, ReactiveFormsModule],
      template: `<techyon-date-picker testId="date" [formControl]="control" />`,
    })
    class HostComponent {
      readonly control = new FormControl<Date | null>(null, Validators.required);
    }

    let host: ComponentFixture<HostComponent>;
    const hostInput = () => host.nativeElement.querySelector('input') as HTMLInputElement;
    const hostError = () => host.nativeElement.querySelector('.date-field__error');

    beforeEach(() => {
      host = TestBed.createComponent(HostComponent);
      host.detectChanges();
    });

    it('hides the error until the control is touched, then shows the default message', () => {
      expect(hostError()).toBeNull();

      hostInput().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      host.detectChanges();

      expect(hostError()?.textContent).toContain('required');
    });

    it('pushes a typed date into the form control', () => {
      hostInput().value = '09/24/2026';
      hostInput().dispatchEvent(new Event('input'));
      hostInput().dispatchEvent(new Event('blur'));
      host.detectChanges();

      expect(host.componentInstance.control.value).toEqual(SEPT_24);
      expect(host.componentInstance.control.valid).toBe(true);
    });

    it('shows a value set on the control', () => {
      host.componentInstance.control.setValue(SEPT_24);
      host.detectChanges();

      expect(hostInput().value).toBe('09/24/2026');
    });

    it('clears the field when the control is reset', () => {
      host.componentInstance.control.setValue(SEPT_24);
      host.detectChanges();

      host.componentInstance.control.reset();
      host.detectChanges();

      expect(hostInput().value).toBe('');
    });

    it('turns unusable text into an empty control (so `required` still fails)', () => {
      host.componentInstance.control.setValue(SEPT_24);
      host.detectChanges();

      hostInput().value = 'nope';
      hostInput().dispatchEvent(new Event('input'));
      hostInput().dispatchEvent(new Event('blur'));
      host.detectChanges();

      expect(host.componentInstance.control.value).toBeNull();
      expect(host.componentInstance.control.hasError('required')).toBe(true);
      // The date-specific reason wins over the generic `required` one.
      expect(hostError()?.textContent).toContain('valid date');
    });

    it('prefers a custom message from errorMessages over the built-in default', () => {
      @Component({
        standalone: true,
        imports: [DatePicker, ReactiveFormsModule],
        template: `<techyon-date-picker
          testId="date"
          [formControl]="control"
          [errorMessages]="{ required: 'Pick a date.' }"
        />`,
      })
      class CustomMessageHost {
        readonly control = new FormControl<Date | null>(null, Validators.required);
      }

      const custom = TestBed.createComponent(CustomMessageHost);
      custom.detectChanges();
      custom.nativeElement
        .querySelector('input')
        .dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      custom.detectChanges();

      expect(custom.nativeElement.querySelector('.date-field__error')?.textContent).toContain(
        'Pick a date.',
      );
    });
  });
});
