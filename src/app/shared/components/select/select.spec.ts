import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Select } from './select';

const OPTIONS = [
  { label: 'Red', value: 'red' },
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
];

describe('Select', () => {
  let component: Select;
  let fixture: ComponentFixture<Select>;
  let el: HTMLElement;

  const trigger = () => el.querySelector<HTMLButtonElement>('.select__trigger')!;
  // The panel renders in the CDK overlay container, outside the component's own element.
  const options = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.select__option'));
  const press = (key: string) => {
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Select],
    }).compileComponents();

    fixture = TestBed.createComponent(Select);
    fixture.componentRef.setInput('testId', 'stub-select');
    fixture.componentRef.setInput('options', OPTIONS);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the placeholder until a value is chosen', () => {
    expect(trigger().textContent).toContain('Select…');
  });

  it('opens on click and selects an option', () => {
    trigger().click();
    fixture.detectChanges();
    expect(options()).toHaveLength(3);

    options()[1].click();
    fixture.detectChanges();

    expect(component.value()).toBe('green');
    expect(trigger().textContent).toContain('Green');
    expect(options()).toHaveLength(0);
  });

  it('supports keyboard selection', () => {
    press('ArrowDown');
    press('ArrowDown');
    press('Enter');

    expect(component.value()).toBe('green');
    expect(options()).toHaveLength(0);
  });

  it('closes on Escape without changing the value', () => {
    press('ArrowDown');
    expect(options()).toHaveLength(3);
    press('Escape');
    expect(options()).toHaveLength(0);
    expect(component.value()).toBeNull();
  });

  it('closes when clicking outside', () => {
    trigger().click();
    fixture.detectChanges();
    document.body.click();
    fixture.detectChanges();
    expect(options()).toHaveLength(0);
  });

  describe('clearable', () => {
    const clearButton = () => el.querySelector<HTMLButtonElement>('.select__clear');

    it('is off by default', () => {
      component.value.set('red');
      fixture.detectChanges();
      expect(clearButton()).toBeNull();
    });

    it('shows only while a value is selected and clears it', () => {
      fixture.componentRef.setInput('clearable', true);
      fixture.detectChanges();
      expect(clearButton()).toBeNull();

      component.value.set('red');
      fixture.detectChanges();
      expect(clearButton()).not.toBeNull();

      clearButton()!.click();
      fixture.detectChanges();
      expect(component.value()).toBeNull();
      expect(clearButton()).toBeNull();
      expect(trigger().textContent).toContain('Select…');
    });

    it('clears with Delete on the trigger', () => {
      fixture.componentRef.setInput('clearable', true);
      component.value.set('red');
      fixture.detectChanges();

      press('Delete');
      expect(component.value()).toBeNull();
    });
  });
});
