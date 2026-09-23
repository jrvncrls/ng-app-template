import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiSelect } from './multi-select';

const OPTIONS = [
  { label: 'Angular', value: 'angular' },
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
];

describe('MultiSelect', () => {
  let component: MultiSelect;
  let fixture: ComponentFixture<MultiSelect>;
  let el: HTMLElement;

  const control = () => el.querySelector<HTMLElement>('.multi-select__control')!;
  const search = () => el.querySelector<HTMLInputElement>('.multi-select__search')!;
  const chips = () =>
    Array.from(el.querySelectorAll('.multi-select__chip-label')).map((chip) =>
      chip.textContent?.trim(),
    );
  // The panel renders in the CDK overlay container, outside the component's own element.
  const options = () =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('.multi-select__option'));
  const clearButton = () => el.querySelector<HTMLButtonElement>('.multi-select__clear');
  const type = (text: string) => {
    search().value = text;
    search().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const press = (key: string) => {
    search().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSelect],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiSelect);
    fixture.componentRef.setInput('testId', 'stub-multi-select');
    fixture.componentRef.setInput('options', OPTIONS);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens on click and shows picked options as chips, staying open', () => {
    control().click();
    fixture.detectChanges();
    options()[0].click();
    fixture.detectChanges();
    options()[2].click();
    fixture.detectChanges();

    expect(component.value()).toEqual(['angular', 'vue']);
    expect(chips()).toEqual(['Angular', 'Vue']);
    expect(options()).toHaveLength(3);
  });

  it('removes a chip with its x button', () => {
    component.value.set(['angular', 'vue']);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.multi-select__chip-remove')!.click();
    fixture.detectChanges();
    expect(component.value()).toEqual(['vue']);
  });

  it('filters the panel as you type and shows an empty message', () => {
    type('re');
    expect(options().map((option) => option.textContent?.trim())).toEqual(['React']);

    type('zzz');
    expect(options()).toHaveLength(0);
    expect(document.querySelector('.multi-select__empty')?.textContent).toContain('No items found');
  });

  it('supports keyboard selection, Backspace to drop the last chip, and Escape', () => {
    press('ArrowDown');
    press('ArrowDown');
    press('Enter');
    expect(component.value()).toEqual(['react']);

    press('Backspace');
    expect(component.value()).toEqual([]);

    press('Escape');
    expect(options()).toHaveLength(0);
  });

  it('keeps Backspace for editing while there is search text', () => {
    component.value.set(['angular']);
    type('a');
    press('Backspace');
    expect(component.value()).toEqual(['angular']);
  });

  it('only shows the clear button when clearable with a selection, and clears it', () => {
    component.value.set(['angular']);
    fixture.detectChanges();
    expect(clearButton()).toBeNull();

    fixture.componentRef.setInput('clearable', true);
    fixture.detectChanges();
    expect(clearButton()).not.toBeNull();

    clearButton()!.click();
    fixture.detectChanges();
    expect(component.value()).toEqual([]);
    expect(clearButton()).toBeNull();
  });
});
