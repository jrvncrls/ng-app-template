import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  compareDays,
  endOfMonth,
  formatDate,
  formatDateRange,
  getDateError,
  getMonthGrid,
  isSameDateRange,
  isSameDay,
  isValidDate,
  parseDate,
  parseDateRange,
  splitDateRangeText,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from './date-utils';

describe('date-utils', () => {
  describe('day arithmetic', () => {
    it('startOfDay drops the time of day', () => {
      const result = startOfDay(new Date(2026, 8, 24, 15, 30, 12));
      expect(result).toEqual(new Date(2026, 8, 24));
    });

    it('addDays rolls over month and year boundaries in both directions', () => {
      expect(addDays(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 1));
      expect(addDays(new Date(2026, 0, 1), -1)).toEqual(new Date(2025, 11, 31));
      expect(addDays(new Date(2026, 8, 24), 0)).toEqual(new Date(2026, 8, 24));
    });

    it('addMonths keeps the day of month where it exists', () => {
      expect(addMonths(new Date(2026, 8, 24), 1)).toEqual(new Date(2026, 9, 24));
      expect(addMonths(new Date(2026, 0, 15), -1)).toEqual(new Date(2025, 11, 15));
    });

    it('addMonths clamps to the last day of a shorter month', () => {
      expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
      expect(addMonths(new Date(2028, 0, 31), 1)).toEqual(new Date(2028, 1, 29));
    });

    it('addYears moves whole years and clamps Feb 29', () => {
      expect(addYears(new Date(2026, 8, 24), -1)).toEqual(new Date(2025, 8, 24));
      expect(addYears(new Date(2028, 1, 29), 1)).toEqual(new Date(2029, 1, 28));
    });

    it('startOfMonth / endOfMonth bound the month', () => {
      expect(startOfMonth(new Date(2026, 8, 24))).toEqual(new Date(2026, 8, 1));
      expect(endOfMonth(new Date(2026, 8, 24))).toEqual(new Date(2026, 8, 30));
      expect(endOfMonth(new Date(2028, 1, 10))).toEqual(new Date(2028, 1, 29));
    });

    it('startOfWeek honours the configured first day', () => {
      const thursday = new Date(2026, 8, 24);
      expect(startOfWeek(thursday, 0)).toEqual(new Date(2026, 8, 20));
      expect(startOfWeek(thursday, 1)).toEqual(new Date(2026, 8, 21));
      expect(startOfWeek(new Date(2026, 8, 20), 1)).toEqual(new Date(2026, 8, 14));
    });
  });

  describe('comparison', () => {
    it('isSameDay ignores the time and treats two empties as equal', () => {
      expect(isSameDay(new Date(2026, 8, 24, 1), new Date(2026, 8, 24, 23))).toBe(true);
      expect(isSameDay(new Date(2026, 8, 24), new Date(2026, 8, 25))).toBe(false);
      expect(isSameDay(null, null)).toBe(true);
      expect(isSameDay(new Date(2026, 8, 24), null)).toBe(false);
    });

    it('isSameDateRange compares both ends', () => {
      const range = { start: new Date(2026, 0, 1), end: new Date(2026, 0, 5) };
      expect(
        isSameDateRange(range, { start: new Date(2026, 0, 1), end: new Date(2026, 0, 5) }),
      ).toBe(true);
      expect(
        isSameDateRange(range, { start: new Date(2026, 0, 1), end: new Date(2026, 0, 6) }),
      ).toBe(false);
      expect(isSameDateRange(null, null)).toBe(true);
      expect(isSameDateRange(range, null)).toBe(false);
    });

    it('compareDays orders by calendar day only', () => {
      expect(compareDays(new Date(2026, 0, 1, 23), new Date(2026, 0, 2, 1))).toBeLessThan(0);
      expect(compareDays(new Date(2026, 0, 2), new Date(2026, 0, 1))).toBeGreaterThan(0);
      expect(compareDays(new Date(2026, 0, 1, 1), new Date(2026, 0, 1, 23))).toBe(0);
    });

    it('clampDate pulls a date inside the bounds', () => {
      const min = new Date(2026, 5, 10);
      const max = new Date(2026, 5, 20);
      expect(clampDate(new Date(2026, 5, 1), min, max)).toEqual(min);
      expect(clampDate(new Date(2026, 5, 30), min, max)).toEqual(max);
      expect(clampDate(new Date(2026, 5, 15), min, max)).toEqual(new Date(2026, 5, 15));
      expect(clampDate(new Date(2026, 5, 15))).toEqual(new Date(2026, 5, 15));
    });

    it('isValidDate rejects non-dates and Invalid Date', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('nope'))).toBe(false);
      expect(isValidDate('2026-01-01')).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });

  describe('getMonthGrid', () => {
    it('is always 6 weeks of 7 days', () => {
      for (const month of [new Date(2026, 1, 1), new Date(2026, 8, 1), new Date(2026, 11, 1)]) {
        const grid = getMonthGrid(month, 0);
        expect(grid).toHaveLength(6);
        grid.forEach((week) => expect(week).toHaveLength(7));
      }
    });

    it('starts on the configured weekday and contains the whole month', () => {
      // September 2026 starts on a Tuesday.
      const sundayGrid = getMonthGrid(new Date(2026, 8, 1), 0);
      expect(sundayGrid[0][0]).toEqual(new Date(2026, 7, 30));
      expect(sundayGrid[0][2]).toEqual(new Date(2026, 8, 1));

      const mondayGrid = getMonthGrid(new Date(2026, 8, 1), 1);
      expect(mondayGrid[0][0]).toEqual(new Date(2026, 7, 31));
      expect(mondayGrid[0][1]).toEqual(new Date(2026, 8, 1));

      const days = sundayGrid.flat().filter((date) => date.getMonth() === 8);
      expect(days).toHaveLength(30);
    });

    it('needs no leading days when the month starts on the first weekday', () => {
      // February 2026 starts on a Sunday.
      expect(getMonthGrid(new Date(2026, 1, 1), 0)[0][0]).toEqual(new Date(2026, 1, 1));
    });
  });

  describe('getDateError', () => {
    const min = new Date(2026, 5, 10);
    const max = new Date(2026, 5, 20);
    const isDateDisabled = (date: Date) => date.getDay() === 0;

    it('reports which constraint a date breaks', () => {
      expect(getDateError(new Date(2026, 5, 9), { min, max })).toBe('minDate');
      expect(getDateError(new Date(2026, 5, 21), { min, max })).toBe('maxDate');
      expect(getDateError(new Date(2026, 5, 14), { min, max, isDateDisabled })).toBe(
        'disabledDate',
      );
    });

    it('treats the bounds themselves as valid', () => {
      expect(getDateError(min, { min, max })).toBeNull();
      expect(getDateError(max, { min, max })).toBeNull();
    });

    it('accepts everything when unconstrained', () => {
      expect(getDateError(new Date(1900, 0, 1), {})).toBeNull();
    });
  });

  describe('formatDate', () => {
    const date = new Date(2026, 0, 2);

    it('pads and orders per the format', () => {
      expect(formatDate(date, 'MM/dd/yyyy')).toBe('01/02/2026');
      expect(formatDate(date, 'dd.MM.yyyy')).toBe('02.01.2026');
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2026-01-02');
    });

    it('zero-pads short years', () => {
      expect(formatDate(createYear(987), 'yyyy')).toBe('0987');
    });
  });

  describe('parseDate', () => {
    it('round-trips whatever formatDate produces', () => {
      const date = new Date(2026, 11, 31);
      for (const format of ['MM/dd/yyyy', 'dd.MM.yyyy', 'yyyy-MM-dd', 'dd MM yyyy']) {
        expect(parseDate(formatDate(date, format), format)).toEqual(date);
      }
    });

    it('accepts unpadded values and a different separator', () => {
      expect(parseDate('1/2/2026', 'MM/dd/yyyy')).toEqual(new Date(2026, 0, 2));
      expect(parseDate('01-02-2026', 'MM/dd/yyyy')).toEqual(new Date(2026, 0, 2));
      expect(parseDate(' 01.02.2026 ', 'MM/dd/yyyy')).toEqual(new Date(2026, 0, 2));
    });

    it('reads day and month in the order the format says', () => {
      expect(parseDate('02/01/2026', 'dd/MM/yyyy')).toEqual(new Date(2026, 0, 2));
      expect(parseDate('02/01/2026', 'MM/dd/yyyy')).toEqual(new Date(2026, 1, 1));
    });

    it('rejects dates that do not exist instead of rolling them over', () => {
      expect(parseDate('02/30/2026', 'MM/dd/yyyy')).toBeNull();
      expect(parseDate('13/01/2026', 'MM/dd/yyyy')).toBeNull();
      expect(parseDate('00/10/2026', 'MM/dd/yyyy')).toBeNull();
      expect(parseDate('02/29/2026', 'MM/dd/yyyy')).toBeNull();
      expect(parseDate('02/29/2028', 'MM/dd/yyyy')).toEqual(new Date(2028, 1, 29));
    });

    it('rejects malformed text', () => {
      expect(parseDate('', 'MM/dd/yyyy')).toBeNull();
      expect(parseDate('   ', 'MM/dd/yyyy')).toBeNull();
      expect(parseDate('hello', 'MM/dd/yyyy')).toBeNull();
      expect(parseDate('01/02/26', 'MM/dd/yyyy')).toBeNull();
      expect(parseDate('01/02/2026 extra', 'MM/dd/yyyy')).toBeNull();
    });

    it('returns null for a format that is missing a token', () => {
      expect(parseDate('01/2026', 'MM/yyyy')).toBeNull();
      expect(parseDate('01/01/01/2026', 'MM/MM/dd/yyyy')).toBeNull();
    });
  });

  describe('date ranges', () => {
    it('formatDateRange joins the two ends with an en dash', () => {
      const range = { start: new Date(2026, 0, 1), end: new Date(2026, 0, 5) };
      expect(formatDateRange(range, 'MM/dd/yyyy')).toBe('01/01/2026 – 01/05/2026');
    });

    it('splitDateRangeText accepts an en dash, em dash, hyphen or "to"', () => {
      for (const separator of ['–', '—', '-', 'to', 'TO']) {
        expect(splitDateRangeText(`a ${separator} b`)).toEqual(['a', 'b']);
      }
    });

    it('splitDateRangeText leaves hyphenated ISO dates alone', () => {
      expect(splitDateRangeText('2026-01-01 – 2026-01-05')).toEqual(['2026-01-01', '2026-01-05']);
      expect(splitDateRangeText('2026-01-01 - 2026-01-05')).toEqual(['2026-01-01', '2026-01-05']);
    });

    it('splitDateRangeText rejects text without exactly two halves', () => {
      expect(splitDateRangeText('01/01/2026')).toBeNull();
      expect(splitDateRangeText('a – b – c')).toBeNull();
      expect(splitDateRangeText('a – ')).toBeNull();
    });

    it('parseDateRange round-trips formatDateRange', () => {
      const range = { start: new Date(2026, 0, 1), end: new Date(2026, 0, 5) };
      expect(parseDateRange(formatDateRange(range, 'yyyy-MM-dd'), 'yyyy-MM-dd')).toEqual(range);
    });

    it('parseDateRange is null when either half is not a date', () => {
      expect(parseDateRange('01/01/2026 – nope', 'MM/dd/yyyy')).toBeNull();
      expect(parseDateRange('01/01/2026', 'MM/dd/yyyy')).toBeNull();
    });
  });
});

function createYear(year: number): Date {
  const date = new Date(2000, 0, 1);
  date.setFullYear(year);
  return date;
}
