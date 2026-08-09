import { formatLongDate, getCalendarGrid, toDateString } from './date-range';

describe('toDateString', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toDateString(new Date(2026, 7, 9))).toBe('2026-08-09');
  });

  it('pads single-digit months and days', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('does not shift the date for a time late in the day (UTC+ timezone regression)', () => {
    const lateInDay = new Date(2026, 7, 9, 23, 30);

    expect(toDateString(lateInDay)).toBe('2026-08-09');
  });
});

describe('formatLongDate', () => {
  it('formats a date with month, day, and year', () => {
    expect(formatLongDate(new Date(2026, 7, 9))).toBe('Aug 9, 2026');
  });
});

describe('getCalendarGrid', () => {
  it('pads leading blanks so the first day lands on its correct weekday (Mon-first)', () => {
    // August 2026 starts on a Saturday.
    const weeks = getCalendarGrid(new Date(2026, 7, 1));

    expect(weeks[0]).toEqual([null, null, null, null, null, new Date(2026, 7, 1), new Date(2026, 7, 2)]);
  });

  it('includes every day of the month exactly once', () => {
    const weeks = getCalendarGrid(new Date(2026, 7, 1));
    const days = weeks.flat().filter((day): day is Date => day !== null);

    expect(days).toHaveLength(31);
    expect(days[0]).toEqual(new Date(2026, 7, 1));
    expect(days[days.length - 1]).toEqual(new Date(2026, 7, 31));
  });

  it('pads trailing blanks so every week has 7 entries', () => {
    const weeks = getCalendarGrid(new Date(2026, 7, 1));

    weeks.forEach(week => expect(week).toHaveLength(7));
  });

  it('has no leading blanks when the month starts on a Monday', () => {
    // June 2026 starts on a Monday.
    const weeks = getCalendarGrid(new Date(2026, 5, 1));

    expect(weeks[0][0]).toEqual(new Date(2026, 5, 1));
  });
});
