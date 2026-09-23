import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Autocomplete } from './autocomplete';

const OPTIONS = [
  { label: 'Apple', value: 'fruit-1' },
  { label: 'Apricot', value: 'fruit-2' },
  { label: 'Banana', value: 'fruit-3' },
];

describe('Autocomplete', () => {
  let component: Autocomplete;
  let fixture: ComponentFixture<Autocomplete>;
  let el: HTMLElement;

  const input = () => el.querySelector<HTMLInputElement>('.autocomplete__field')!;
  // The panel renders in the CDK overlay container, outside the component's own element.
  const options = () =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('.autocomplete__option'));
  const clearButton = () => el.querySelector<HTMLButtonElement>('.autocomplete__clear');
  const type = (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const press = (key: string) => {
    input().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Autocomplete],
    }).compileComponents();

    fixture = TestBed.createComponent(Autocomplete);
    fixture.componentRef.setInput('testId', 'stub-autocomplete');
    fixture.componentRef.setInput('options', OPTIONS);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters suggestions as you type and selects one on click', () => {
    type('ap');
    expect(options().map((option) => option.textContent?.trim())).toEqual(['Apple', 'Apricot']);

    options()[1].click();
    fixture.detectChanges();
    expect(component.value()).toBe('fruit-2');
    expect(input().value).toBe('Apricot');
    expect(options()).toHaveLength(0);
  });

  it('supports keyboard selection and Escape', () => {
    type('ap');
    press('ArrowDown');
    press('ArrowDown');
    press('Enter');
    expect(component.value()).toBe('fruit-2');
    expect(input().value).toBe('Apricot');

    type('b');
    press('Escape');
    expect(options()).toHaveLength(0);
  });

  it('does not swallow Enter when no suggestion is highlighted', () => {
    type('ap');
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    input().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(component.value()).toBe('ap');
  });

  it('shows the label for a value set from outside', () => {
    component.writeValue('fruit-3');
    fixture.detectChanges();
    expect(input().value).toBe('Banana');
  });

  it('only shows the clear button when clearable with text, and clears it', () => {
    type('ap');
    expect(clearButton()).toBeNull();

    fixture.componentRef.setInput('clearable', true);
    fixture.detectChanges();
    expect(clearButton()).not.toBeNull();

    clearButton()!.click();
    fixture.detectChanges();
    expect(component.value()).toBe('');
    expect(input().value).toBe('');
    expect(clearButton()).toBeNull();
  });
});
