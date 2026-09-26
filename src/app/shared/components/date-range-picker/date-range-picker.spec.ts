import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { DateRange, DateRangePicker } from './date-range-picker';

const RANGE: DateRange = { start: new Date(2026, 8, 10), end: new Date(2026, 8, 14) };

// Same shape as the DatePicker spec. The interesting part is the two-click
// selection in the calendar popup, which renders in the CDK overlay container
// (outside the component's own element).
describe('DateRangePicker', () => {
  let fixture: ComponentFixture<DateRangePicker>;
  let component: DateRangePicker;
  let el: HTMLElement;

  const input = () => el.querySelector<HTMLInputElement>('input')!;
  const toggle = () => el.querySelector<HTMLButtonElement>('.date-field__toggle')!;
  const panel = () => document.querySelector<HTMLElement>('.date-field__panel');
  const day = (key: string) => document.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)!;
  const error = () => el.querySelector('.date-field__error')?.textContent?.trim() ?? null;
  const hint = () => document.querySelector('.date-field__hint')!.textContent!.trim();
  const inRange = () =>
    Array.from(document.querySelectorAll('.calendar__day--in-range')).map((d) =>
      d.getAttribute('data-date'),
    );

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
  const click = (key: string) => {
    day(key).click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateRangePicker],
    }).compileComponents();

    fixture = TestBed.createComponent(DateRangePicker);
    fixture.componentRef.setInput('testId', 'stub-date-range-picker');
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
    it('shows the format twice as the placeholder unless one is given', () => {
      expect(input().placeholder).toBe('MM/DD/YYYY – MM/DD/YYYY');

      fixture.componentRef.setInput('placeholder', 'Pick dates');
      fixture.detectChanges();
      expect(input().placeholder).toBe('Pick dates');
    });

    it('shows a range set from outside, joined by an en dash', () => {
      component.value.set(RANGE);
      fixture.detectChanges();
      expect(input().value).toBe('09/10/2026 – 09/14/2026');

      fixture.componentRef.setInput('format', 'yyyy-MM-dd');
      fixture.detectChanges();
      expect(input().value).toBe('2026-09-10 – 2026-09-14');
    });

    it('turns typed text into the range on blur, not on every keystroke', () => {
      type('09/10/2026 – 09/14/2026');
      expect(component.value()).toBeNull();

      blur();
      expect(component.value()).toEqual(RANGE);
    });

    it('accepts a hyphen or "to" between the dates and normalises the text', () => {
      typeAndBlur('9/10/2026 to 9/14/2026');
      expect(component.value()).toEqual(RANGE);
      expect(input().value).toBe('09/10/2026 – 09/14/2026');

      typeAndBlur('09-10-2026 - 09-14-2026');
      expect(component.value()).toEqual(RANGE);
    });

    it('accepts a one-day range', () => {
      typeAndBlur('09/10/2026 – 09/10/2026');
      expect(component.value()).toEqual({ start: RANGE.start, end: RANGE.start });
      expect(error()).toBeNull();
    });

    it('applies typed text on Enter, and only a second Enter is left to submit a form', () => {
      type('09/10/2026 – 09/14/2026');
      const first = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      input().dispatchEvent(first);
      expect(component.value()).toEqual(RANGE);
      expect(first.defaultPrevented).toBe(true);

      const second = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      input().dispatchEvent(second);
      expect(second.defaultPrevented).toBe(false);
    });

    it('clears the range when the text is emptied', () => {
      component.value.set(RANGE);
      fixture.detectChanges();

      typeAndBlur('');

      expect(component.value()).toBeNull();
      expect(error()).toBeNull();
    });

    it('rejects text that is not two dates', () => {
      for (const text of ['nope', '09/10/2026', '09/10/2026 – nope', '13/45/2026 – 09/14/2026']) {
        typeAndBlur(text);
        expect(component.value()).toBeNull();
        expect(error()).toBe('Please enter a valid date.');
        expect(input().value).toBe(text);
      }
    });

    it('rejects an end date before the start date', () => {
      typeAndBlur('09/14/2026 – 09/10/2026');

      expect(component.value()).toBeNull();
      expect(error()).toBe('The end date must not be before the start date.');
    });

    it('rejects either end outside min / max or matched by isDateDisabled', () => {
      fixture.componentRef.setInput('min', new Date(2026, 8, 10));
      fixture.componentRef.setInput('max', new Date(2026, 8, 20));
      fixture.componentRef.setInput('isDateDisabled', (date: Date) => date.getDay() === 0);
      fixture.detectChanges();

      typeAndBlur('09/09/2026 – 09/14/2026');
      expect(error()).toBe('This date is too early.');

      typeAndBlur('09/14/2026 – 09/21/2026');
      expect(error()).toBe('This date is too late.');

      typeAndBlur('09/14/2026 – 09/20/2026'); // ends on a Sunday
      expect(error()).toBe('This date is not available.');

      typeAndBlur('09/14/2026 – 09/19/2026');
      expect(error()).toBeNull();
      expect(component.value()).toEqual({
        start: new Date(2026, 8, 14),
        end: new Date(2026, 8, 19),
      });
    });

    it('lets a range span a disabled day between its ends', () => {
      fixture.componentRef.setInput('isDateDisabled', (date: Date) => date.getDay() === 0);
      fixture.detectChanges();

      typeAndBlur('09/19/2026 – 09/22/2026'); // spans Sunday 09/20

      expect(error()).toBeNull();
      expect(component.value()).toEqual({
        start: new Date(2026, 8, 19),
        end: new Date(2026, 8, 22),
      });
    });

    it('keeps a rejected range in the field next to its error, even when it replaces a valid one', () => {
      component.value.set(RANGE);
      fixture.detectChanges();

      typeAndBlur('09/14/2026 – 09/10/2026');
      fixture.detectChanges();

      expect(component.value()).toBeNull();
      expect(input().value).toBe('09/14/2026 – 09/10/2026');
      expect(error()).toBe('The end date must not be before the start date.');
    });

    it('takes a value set from outside over a leftover error', () => {
      typeAndBlur('nope');
      expect(error()).not.toBeNull();

      component.value.set(RANGE);
      fixture.detectChanges();

      expect(input().value).toBe('09/10/2026 – 09/14/2026');
      expect(error()).toBeNull();
    });

    it('prefers custom messages from errorMessages', () => {
      fixture.componentRef.setInput('errorMessages', {
        invalidRange: 'Check-out is before check-in.',
      });
      fixture.detectChanges();

      typeAndBlur('09/14/2026 – 09/10/2026');

      expect(error()).toBe('Check-out is before check-in.');
    });
  });

  describe('calendar popup', () => {
    beforeEach(() => {
      component.value.set(RANGE);
      fixture.detectChanges();
    });

    it('opens as a dialog on the start of the current range and draws it', () => {
      openPanel();

      expect(panel()!.getAttribute('role')).toBe('dialog');
      expect(document.querySelector('.calendar__title')!.textContent).toContain('September 2026');
      expect(day('2026-09-10').classList).toContain('calendar__day--selected');
      expect(day('2026-09-14').classList).toContain('calendar__day--selected');
      expect(inRange()).toEqual(['2026-09-11', '2026-09-12', '2026-09-13']);
      expect(document.activeElement).toBe(day('2026-09-10'));
    });

    it('picks a range with two clicks, then closes, formats the text and returns focus', () => {
      openPanel();
      click('2026-09-16');
      expect(component.value()).toEqual(RANGE); // not yet — only half-picked
      expect(panel()).not.toBeNull();

      click('2026-09-22');

      expect(component.value()).toEqual({
        start: new Date(2026, 8, 16),
        end: new Date(2026, 8, 22),
      });
      expect(input().value).toBe('09/16/2026 – 09/22/2026');
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(toggle());
    });

    it('shows only the range being picked after the first click', () => {
      openPanel();
      expect(hint()).toBe('Select a start date');

      click('2026-09-16');

      expect(hint()).toBe('Select an end date');
      expect(day('2026-09-16').classList).toContain('calendar__day--selected');
      // The saved range is out of the way until the new one is complete.
      expect(day('2026-09-10').classList).not.toContain('calendar__day--selected');
      expect(day('2026-09-14').classList).not.toContain('calendar__day--selected');
      expect(inRange()).toEqual([]);
    });

    it('restarts the range when the second click is before the first', () => {
      openPanel();
      click('2026-09-16');
      click('2026-09-05');

      expect(panel()).not.toBeNull();
      expect(hint()).toBe('Select an end date');
      expect(day('2026-09-05').classList).toContain('calendar__day--selected');
      expect(day('2026-09-16').classList).not.toContain('calendar__day--selected');

      click('2026-09-08');
      expect(component.value()).toEqual({ start: new Date(2026, 8, 5), end: new Date(2026, 8, 8) });
    });

    it('accepts the same day twice as a one-day range', () => {
      openPanel();
      click('2026-09-16');
      click('2026-09-16');

      expect(component.value()).toEqual({
        start: new Date(2026, 8, 16),
        end: new Date(2026, 8, 16),
      });
      expect(input().value).toBe('09/16/2026 – 09/16/2026');
    });

    it('can span months by paging between the two clicks', () => {
      openPanel();
      click('2026-09-28');
      document.querySelector<HTMLButtonElement>('[aria-label="Next month"]')!.click();
      fixture.detectChanges();
      click('2026-10-03');

      expect(component.value()).toEqual({
        start: new Date(2026, 8, 28),
        end: new Date(2026, 9, 3),
      });
    });

    it('discards a half-picked range when closed with Escape', () => {
      openPanel();
      click('2026-09-16');
      day('2026-09-16').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      fixture.detectChanges();

      expect(panel()).toBeNull();
      expect(component.value()).toEqual(RANGE);
      expect(document.activeElement).toBe(toggle());

      // Reopening starts a fresh selection, showing the saved range again.
      openPanel();
      expect(hint()).toBe('Select a start date');
      expect(day('2026-09-14').classList).toContain('calendar__day--selected');
    });

    it('discards a half-picked range when clicking outside, and marks the field touched', () => {
      openPanel();
      click('2026-09-16');
      document.body.click();
      fixture.detectChanges();

      expect(panel()).toBeNull();
      expect(component.value()).toEqual(RANGE);
      expect(component['touched']()).toBe(true);
    });

    it('does not let Escape reach anything behind the popup', () => {
      const behind = vi.fn();
      document.body.addEventListener('keydown', behind);
      openPanel();

      day('2026-09-10').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );

      expect(behind).not.toHaveBeenCalled();
      document.body.removeEventListener('keydown', behind);
    });

    it('opens with Alt+ArrowDown from the input', () => {
      input().dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true }),
      );
      fixture.detectChanges();
      expect(panel()).not.toBeNull();
    });

    it('applies unsaved typed text before opening on it', () => {
      type('03/15/2027 – 03/20/2027');
      openPanel();

      expect(component.value()).toEqual({
        start: new Date(2027, 2, 15),
        end: new Date(2027, 2, 20),
      });
      expect(document.querySelector('.calendar__title')!.textContent).toContain('March 2027');
    });

    it('passes min, max, disabled dates and the week start to the calendar', () => {
      fixture.componentRef.setInput('min', new Date(2026, 8, 5));
      fixture.componentRef.setInput('isDateDisabled', (date: Date) => date.getDay() === 6);
      fixture.componentRef.setInput('weekStartsOn', 1);
      fixture.detectChanges();
      openPanel();

      expect(day('2026-09-04').getAttribute('aria-disabled')).toBe('true');
      expect(day('2026-09-12').getAttribute('aria-disabled')).toBe('true'); // a Saturday
      expect(day('2026-09-15').hasAttribute('aria-disabled')).toBe(false);
      expect(document.querySelector('.calendar__day')!.getAttribute('data-date')).toBe(
        '2026-08-31',
      );
    });

    it('ignores clicks on disabled days', () => {
      fixture.componentRef.setInput('min', new Date(2026, 8, 5));
      fixture.detectChanges();
      openPanel();

      click('2026-09-04');

      expect(hint()).toBe('Select a start date');
    });

    it('clears the range', () => {
      openPanel();
      document.querySelector<HTMLElement>('[data-testid="stub-date-range-picker-clear"]')!.click();
      fixture.detectChanges();

      expect(component.value()).toBeNull();
      expect(input().value).toBe('');
      expect(panel()).toBeNull();
    });

    it('disables Clear when there is no range', () => {
      component.value.set(null);
      fixture.detectChanges();
      openPanel();

      const clear = document
        .querySelector('[data-testid="stub-date-range-picker-clear"]')!
        .querySelector('button')!;
      expect(clear.disabled).toBe(true);
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
      component.writeValue(RANGE);
      fixture.detectChanges();

      expect(component.value()).toEqual(RANGE);
      expect(input().value).toBe('09/10/2026 – 09/14/2026');
    });

    it('writeValue treats null, undefined and ranges with an Invalid Date as empty', () => {
      for (const empty of [
        null,
        undefined,
        { start: new Date('nope'), end: RANGE.end },
        { start: RANGE.start, end: new Date('nope') },
      ]) {
        component.writeValue(RANGE);
        component.writeValue(empty as DateRange | null);
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

      component.value.set(RANGE);
      fixture.detectChanges();

      expect(onChange).toHaveBeenCalledWith(RANGE);
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

  describe('reactive forms integration', () => {
    @Component({
      standalone: true,
      imports: [DateRangePicker, ReactiveFormsModule],
      template: `<techyon-date-range-picker testId="range" label="Stay" [formControl]="control" />`,
    })
    class HostComponent {
      readonly control = new FormControl<DateRange | null>(null, Validators.required);
    }

    let host: ComponentFixture<HostComponent>;
    const hostInput = () => host.nativeElement.querySelector('input') as HTMLInputElement;
    const hostError = () => host.nativeElement.querySelector('.date-field__error');

    beforeEach(() => {
      host = TestBed.createComponent(HostComponent);
      host.detectChanges();
    });

    it('shows the required marker for a required control', () => {
      expect(host.nativeElement.querySelector('.text-error')?.textContent).toBe('*');
      expect(hostInput().getAttribute('aria-required')).toBe('true');
    });

    it('hides the error until the control is touched, then shows the default message', () => {
      expect(hostError()).toBeNull();

      hostInput().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      host.detectChanges();

      expect(hostError()?.textContent).toContain('required');
    });

    it('pushes a typed range into the form control', () => {
      hostInput().value = '09/10/2026 – 09/14/2026';
      hostInput().dispatchEvent(new Event('input'));
      hostInput().dispatchEvent(new Event('blur'));
      host.detectChanges();

      expect(host.componentInstance.control.value).toEqual(RANGE);
      expect(host.componentInstance.control.valid).toBe(true);
    });

    it('shows a value set on the control and clears on reset', () => {
      host.componentInstance.control.setValue(RANGE);
      host.detectChanges();
      expect(hostInput().value).toBe('09/10/2026 – 09/14/2026');

      host.componentInstance.control.reset();
      host.detectChanges();
      expect(hostInput().value).toBe('');
    });

    it('turns unusable text into an empty control (so `required` still fails)', () => {
      host.componentInstance.control.setValue(RANGE);
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
        imports: [DateRangePicker, ReactiveFormsModule],
        template: `<techyon-date-range-picker
          testId="range"
          [formControl]="control"
          [errorMessages]="{ required: 'Pick your dates.' }"
        />`,
      })
      class CustomMessageHost {
        readonly control = new FormControl<DateRange | null>(null, Validators.required);
      }

      const custom = TestBed.createComponent(CustomMessageHost);
      custom.detectChanges();
      custom.nativeElement
        .querySelector('input')
        .dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      custom.detectChanges();

      expect(custom.nativeElement.querySelector('.date-field__error')?.textContent).toContain(
        'Pick your dates.',
      );
    });
  });
});
