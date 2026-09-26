import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Calendar } from './calendar';

// September 2026: the 1st is a Tuesday, the 24th a Thursday.
const SEPT_24 = new Date(2026, 8, 24);

describe('Calendar', () => {
  let component: Calendar;
  let fixture: ComponentFixture<Calendar>;
  let el: HTMLElement;

  const day = (key: string) => el.querySelector<HTMLButtonElement>(`[data-date="${key}"]`);
  const title = () => el.querySelector('.calendar__title')!.textContent!.trim();
  const activeKey = () =>
    el.querySelector('.calendar__day[tabindex="0"]')?.getAttribute('data-date');
  const nav = (label: string) => el.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
  const press = (key: string, init: KeyboardEventInit = {}) => {
    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, ...init }),
    );
    fixture.detectChanges();
  };
  const setInputs = (inputs: Record<string, unknown>) => {
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Calendar],
    }).compileComponents();

    fixture = TestBed.createComponent(Calendar);
    fixture.componentRef.setInput('testId', 'stub-calendar');
    fixture.componentRef.setInput('initialDate', SEPT_24);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    // Attached to the app (not just manually checked) so that focus moved in an
    // `afterNextRender` hook lands after the fixture has re-rendered, as it does
    // in a real app.
    fixture.autoDetectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('layout', () => {
    it('titles the grid with the month and year of the initial date', () => {
      expect(title()).toBe('September 2026');
    });

    it('always renders 6 weeks, including the days of the neighbouring months', () => {
      expect(el.querySelectorAll('tbody tr')).toHaveLength(6);
      expect(el.querySelectorAll('.calendar__day')).toHaveLength(42);
      // Sunday-first: the grid opens on Sunday 30 August and the 1st is the third cell.
      expect(el.querySelector('.calendar__day')!.getAttribute('data-date')).toBe('2026-08-30');
      expect(day('2026-08-30')!.classList).toContain('calendar__day--outside');
      expect(day('2026-09-01')!.classList).not.toContain('calendar__day--outside');
    });

    it('starts the week on the configured day', () => {
      const headers = () =>
        Array.from(el.querySelectorAll('th')).map((th) => th.textContent!.trim());
      expect(headers()[0]).toBe('Sun');

      setInputs({ weekStartsOn: 1 });
      expect(headers()[0]).toBe('Mon');
      expect(headers()[6]).toBe('Sun');
      expect(el.querySelector('.calendar__day')!.getAttribute('data-date')).toBe('2026-08-31');
    });

    it('labels each day with its full date for screen readers', () => {
      expect(day('2026-09-24')!.getAttribute('aria-label')).toBe('Thursday, September 24, 2026');
    });

    it('marks today', () => {
      const today = new Date();
      setInputs({ initialDate: today });
      const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(day(key)!.getAttribute('aria-current')).toBe('date');
      expect(el.querySelectorAll('[aria-current="date"]')).toHaveLength(1);
    });
  });

  describe('selection', () => {
    it('emits the clicked day', () => {
      const selected: Date[] = [];
      component.dateSelected.subscribe((date) => selected.push(date));

      day('2026-09-10')!.click();

      expect(selected).toEqual([new Date(2026, 8, 10)]);
    });

    it('selects days from the neighbouring months and follows them', () => {
      day('2026-10-01')!.click();
      fixture.detectChanges();

      expect(title()).toBe('October 2026');
      expect(activeKey()).toBe('2026-10-01');
    });

    it('highlights the start date', () => {
      setInputs({ start: new Date(2026, 8, 10) });

      expect(day('2026-09-10')!.classList).toContain('calendar__day--selected');
      expect(day('2026-09-10')!.closest('td')!.getAttribute('aria-selected')).toBe('true');
      expect(el.querySelectorAll('.calendar__day--selected')).toHaveLength(1);
    });

    it('does not draw a range in single mode', () => {
      setInputs({ start: new Date(2026, 8, 10), end: new Date(2026, 8, 14) });
      expect(el.querySelectorAll('.calendar__day--in-range')).toHaveLength(0);
    });
  });

  describe('min / max / disabled dates', () => {
    it('disables days outside [min, max] and ignores clicks on them', () => {
      setInputs({ min: new Date(2026, 8, 10), max: new Date(2026, 8, 20) });
      const selected = vi.fn();
      component.dateSelected.subscribe(selected);

      expect(day('2026-09-09')!.getAttribute('aria-disabled')).toBe('true');
      expect(day('2026-09-21')!.getAttribute('aria-disabled')).toBe('true');
      expect(day('2026-09-10')!.hasAttribute('aria-disabled')).toBe(false);
      expect(day('2026-09-20')!.hasAttribute('aria-disabled')).toBe(false);

      day('2026-09-09')!.click();
      expect(selected).not.toHaveBeenCalled();
      day('2026-09-15')!.click();
      expect(selected).toHaveBeenCalledTimes(1);
    });

    it('disables days matched by the isDateDisabled predicate', () => {
      setInputs({ isDateDisabled: (date: Date) => date.getDay() === 0 });
      expect(day('2026-09-20')!.getAttribute('aria-disabled')).toBe('true');
      expect(day('2026-09-21')!.hasAttribute('aria-disabled')).toBe(false);
    });

    it('starts focus inside the allowed range', () => {
      setInputs({ min: new Date(2026, 9, 5) });
      expect(activeKey()).toBe('2026-10-05');
    });

    it('stops the month buttons at the range edges', () => {
      setInputs({ min: new Date(2026, 8, 1), max: new Date(2026, 8, 30) });

      expect(nav('Previous month').getAttribute('aria-disabled')).toBe('true');
      expect(nav('Previous year').getAttribute('aria-disabled')).toBe('true');
      expect(nav('Next month').getAttribute('aria-disabled')).toBe('true');
      expect(nav('Next year').getAttribute('aria-disabled')).toBe('true');

      nav('Next month').click();
      fixture.detectChanges();
      expect(title()).toBe('September 2026');
    });
  });

  describe('month navigation', () => {
    it('moves a month or a year at a time', () => {
      nav('Next month').click();
      fixture.detectChanges();
      expect(title()).toBe('October 2026');

      nav('Previous month').click();
      nav('Previous month').click();
      fixture.detectChanges();
      expect(title()).toBe('August 2026');

      nav('Next year').click();
      fixture.detectChanges();
      expect(title()).toBe('August 2027');

      nav('Previous year').click();
      nav('Previous year').click();
      fixture.detectChanges();
      expect(title()).toBe('August 2025');
    });

    it('keeps the day of month when it exists in the new month', () => {
      nav('Next month').click();
      fixture.detectChanges();
      expect(activeKey()).toBe('2026-10-24');
    });

    it('clamps to the last day of a shorter month', () => {
      setInputs({ initialDate: new Date(2026, 0, 31) });
      nav('Next month').click();
      fixture.detectChanges();
      expect(activeKey()).toBe('2026-02-28');
    });
  });

  describe('keyboard', () => {
    beforeEach(() => {
      day('2026-09-24')!.focus();
    });

    it('moves by day with the left and right arrows', () => {
      press('ArrowRight');
      expect(activeKey()).toBe('2026-09-25');
      expect(document.activeElement).toBe(day('2026-09-25'));

      press('ArrowLeft');
      press('ArrowLeft');
      expect(activeKey()).toBe('2026-09-23');
    });

    it('moves by week with the up and down arrows', () => {
      press('ArrowDown');
      expect(activeKey()).toBe('2026-10-01');
      expect(title()).toBe('October 2026');
      expect(document.activeElement).toBe(day('2026-10-01'));

      press('ArrowUp');
      expect(activeKey()).toBe('2026-09-24');
      expect(title()).toBe('September 2026');
    });

    it('jumps to the start and end of the week with Home and End', () => {
      press('Home');
      expect(activeKey()).toBe('2026-09-20');
      press('End');
      expect(activeKey()).toBe('2026-09-26');
    });

    it('changes month with PageUp / PageDown and year with Shift', () => {
      press('PageDown');
      expect(activeKey()).toBe('2026-10-24');
      press('PageUp');
      press('PageUp');
      expect(activeKey()).toBe('2026-08-24');
      press('PageDown', { shiftKey: true });
      expect(activeKey()).toBe('2027-08-24');
      press('PageUp', { shiftKey: true });
      expect(activeKey()).toBe('2026-08-24');
    });

    it('does not run past min / max', () => {
      setInputs({ min: new Date(2026, 8, 22), max: new Date(2026, 8, 26) });
      day('2026-09-24')!.focus();

      press('ArrowLeft');
      press('ArrowLeft');
      press('ArrowLeft');
      expect(activeKey()).toBe('2026-09-22');

      press('PageDown');
      expect(activeKey()).toBe('2026-09-26');
    });

    it('leaves other keys alone', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
      document.activeElement!.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      expect(activeKey()).toBe('2026-09-24');
    });

    it('keeps exactly one day in the tab order', () => {
      expect(el.querySelectorAll('.calendar__day[tabindex="0"]')).toHaveLength(1);
      press('ArrowRight');
      expect(el.querySelectorAll('.calendar__day[tabindex="0"]')).toHaveLength(1);
    });
  });

  describe('focusOnInit', () => {
    it('is off by default', () => {
      expect(el.contains(document.activeElement)).toBe(false);
    });

    it('focuses the active day once rendered', () => {
      const focused = TestBed.createComponent(Calendar);
      focused.componentRef.setInput('testId', 'focused-calendar');
      focused.componentRef.setInput('initialDate', SEPT_24);
      focused.componentRef.setInput('focusOnInit', true);
      document.body.appendChild(focused.nativeElement);
      focused.detectChanges();

      expect(document.activeElement).toBe(
        focused.nativeElement.querySelector('[data-date="2026-09-24"]'),
      );
      focused.nativeElement.remove();
    });
  });

  describe('range mode', () => {
    const rangeClasses = () =>
      Array.from(el.querySelectorAll<HTMLElement>('.calendar__day--in-range')).map((d) =>
        d.getAttribute('data-date'),
      );

    beforeEach(() => {
      setInputs({ mode: 'range' });
    });

    it('draws the band between a complete range, rounding only the ends', () => {
      setInputs({ start: new Date(2026, 8, 10), end: new Date(2026, 8, 13) });

      expect(rangeClasses()).toEqual(['2026-09-11', '2026-09-12']);
      expect(day('2026-09-10')!.classList).toContain('calendar__day--selected');
      expect(day('2026-09-10')!.classList).toContain('calendar__day--range-start');
      expect(day('2026-09-13')!.classList).toContain('calendar__day--selected');
      expect(day('2026-09-13')!.classList).toContain('calendar__day--range-end');
    });

    it('draws a single-day range as just the selected day', () => {
      setInputs({ start: new Date(2026, 8, 10), end: new Date(2026, 8, 10) });

      expect(rangeClasses()).toEqual([]);
      expect(el.querySelectorAll('.calendar__day--selected')).toHaveLength(1);
      expect(el.querySelectorAll('.calendar__day--range-start')).toHaveLength(0);
    });

    it('spans month boundaries', () => {
      setInputs({ start: new Date(2026, 8, 29), end: new Date(2026, 9, 2) });

      // 29 Sep (selected), 30 Sep + 1 Oct (in range), 2 Oct (selected).
      expect(rangeClasses()).toEqual(['2026-09-30', '2026-10-01']);
    });

    it('previews the span to the hovered day while the end is still open', () => {
      setInputs({ start: new Date(2026, 8, 10) });
      expect(rangeClasses()).toEqual([]);

      day('2026-09-13')!.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
      expect(rangeClasses()).toEqual(['2026-09-11', '2026-09-12']);
      expect(day('2026-09-13')!.classList).toContain('calendar__day--range-end');
      // The hovered day is only a preview — it is not drawn as a selected end.
      expect(day('2026-09-13')!.classList).not.toContain('calendar__day--selected');
      expect(el.querySelectorAll('.calendar__day--selected')).toHaveLength(1);

      el.querySelector('tbody')!.dispatchEvent(new MouseEvent('mouseleave'));
      fixture.detectChanges();
      expect(rangeClasses()).toEqual([]);
    });

    it('does not preview a span that would end before the start', () => {
      setInputs({ start: new Date(2026, 8, 10) });

      day('2026-09-05')!.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      expect(rangeClasses()).toEqual([]);
    });

    it('does not drag the preview along when paging months without focusing a day', () => {
      setInputs({ start: new Date(2026, 8, 10) });

      nav('Next month').click();
      nav('Previous month').click();
      fixture.detectChanges();

      expect(rangeClasses()).toEqual([]);
    });

    it('previews to the keyboard-focused day as well', () => {
      setInputs({ start: new Date(2026, 8, 24), initialDate: new Date(2026, 8, 24) });
      day('2026-09-24')!.focus();

      press('ArrowRight');
      press('ArrowRight');

      expect(rangeClasses()).toEqual(['2026-09-25']);
    });
  });
});
