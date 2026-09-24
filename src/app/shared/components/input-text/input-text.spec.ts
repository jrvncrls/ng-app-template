import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { InputText } from './input-text';

// Reference spec: demonstrates testing a CVA-based, signal-backed form
// component — both as a standalone `[(value)]` control and wired into
// reactive forms via `[formControl]`. Use this as the pattern for the other
// form-capable shared components.
describe('InputText', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputText],
    }).compileComponents();
  });

  describe('standalone usage', () => {
    it('syncs typed input back into the value model signal', () => {
      const fixture = TestBed.createComponent(InputText);
      fixture.componentRef.setInput('testId', 'name-field');
      fixture.detectChanges();

      const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
      input.value = 'Ada';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(fixture.componentInstance.value()).toBe('Ada');
    });
  });

  describe('required marker', () => {
    @Component({
      standalone: true,
      imports: [InputText, ReactiveFormsModule],
      template: `
        <techyon-input-text testId="required" label="Email" [formControl]="requiredControl" />
        <techyon-input-text testId="optional" label="Nickname" [formControl]="optionalControl" />
      `,
    })
    class HostComponent {
      readonly requiredControl = new FormControl('', Validators.required);
      readonly optionalControl = new FormControl('');
    }

    it('shows a red asterisk only when the bound control is required', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      const [requiredField, optionalField] =
        fixture.nativeElement.querySelectorAll('techyon-input-text');
      expect(requiredField.querySelector('.text-error')?.textContent).toBe('*');
      expect(requiredField.querySelector('input').getAttribute('aria-required')).toBe('true');
      expect(optionalField.querySelector('.text-error')).toBeNull();
      expect(optionalField.querySelector('input').hasAttribute('aria-required')).toBe(false);
    });

    it('shows the asterisk for the standalone `required` input', () => {
      const fixture = TestBed.createComponent(InputText);
      fixture.componentRef.setInput('testId', 'name-field');
      fixture.componentRef.setInput('label', 'Name');
      fixture.componentRef.setInput('required', true);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.text-error')?.textContent).toBe('*');
    });
  });

  describe('ControlValueAccessor', () => {
    it('writeValue sets the internal value signal', () => {
      const fixture = TestBed.createComponent(InputText);
      fixture.componentRef.setInput('testId', 'email-field');
      fixture.detectChanges();

      fixture.componentInstance.writeValue('ada@example.com');

      expect(fixture.componentInstance.value()).toBe('ada@example.com');
    });

    it('calls the registered onChange callback whenever the value signal changes', () => {
      const fixture = TestBed.createComponent(InputText);
      fixture.componentRef.setInput('testId', 'email-field');
      fixture.detectChanges();

      const onChange = vi.fn();
      fixture.componentInstance.registerOnChange(onChange);

      fixture.componentInstance.value.set('grace@example.com');
      fixture.detectChanges(); // flushes the effect that forwards value() to onChange

      expect(onChange).toHaveBeenCalledWith('grace@example.com');
    });

    it('calls the registered onTouched callback on blur', () => {
      const fixture = TestBed.createComponent(InputText);
      fixture.componentRef.setInput('testId', 'email-field');
      fixture.detectChanges();

      const onTouched = vi.fn();
      fixture.componentInstance.registerOnTouched(onTouched);

      fixture.nativeElement.querySelector('input').dispatchEvent(new Event('blur'));

      expect(onTouched).toHaveBeenCalled();
    });

    it('disables the native input via setDisabledState', () => {
      const fixture = TestBed.createComponent(InputText);
      fixture.componentRef.setInput('testId', 'email-field');
      fixture.detectChanges();

      fixture.componentInstance.setDisabledState(true);
      fixture.detectChanges();

      const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
      expect(input.disabled).toBe(true);
    });
  });

  describe('reactive forms integration', () => {
    @Component({
      standalone: true,
      imports: [InputText, ReactiveFormsModule],
      template: `<techyon-input-text testId="email" [formControl]="control" />`,
    })
    class HostComponent {
      readonly control = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      });
    }

    it('hides the error until the control is touched, then shows the default message', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.input-text__error')).toBeNull();

      fixture.nativeElement.querySelector('input').dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      const errorEl: HTMLElement = fixture.nativeElement.querySelector('.input-text__error');
      expect(errorEl?.textContent).toContain('required');
    });

    it('prefers a custom message from errorMessages over the built-in default', () => {
      @Component({
        standalone: true,
        imports: [InputText, ReactiveFormsModule],
        template: `<techyon-input-text
          testId="email"
          [formControl]="control"
          [errorMessages]="{ required: 'Email is mandatory.' }"
        />`,
      })
      class CustomMessageHost {
        readonly control = new FormControl('', {
          nonNullable: true,
          validators: [Validators.required],
        });
      }

      const fixture = TestBed.createComponent(CustomMessageHost);
      fixture.detectChanges();
      fixture.nativeElement.querySelector('input').dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      const errorEl: HTMLElement = fixture.nativeElement.querySelector('.input-text__error');
      expect(errorEl?.textContent).toContain('Email is mandatory.');
    });
  });
});
