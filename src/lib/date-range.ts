export type Period = 'week' | 'month' | 'year';

export type DateRange = {
  start: Date;
  end: Date;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const mondayOffset = (day.getDay() + 6) % 7;
  return new Date(day.getTime() - mondayOffset * MS_PER_DAY);
}

// end is exclusive
export function getPeriodRange(period: Period, now: Date = new Date()): DateRange {
  switch (period) {
    case 'week': {
      const start = startOfWeek(now);
      return { start, end: new Date(start.getTime() + 7 * MS_PER_DAY) };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return { start, end };
    }
  }
}

export function getPreviousPeriodRange(period: Period, now: Date = new Date()): DateRange {
  const current = getPeriodRange(period, now);
  switch (period) {
    case 'week':
      return {
        start: new Date(current.start.getTime() - 7 * MS_PER_DAY),
        end: current.start,
      };
    case 'month':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: current.start,
      };
    case 'year':
      return {
        start: new Date(now.getFullYear() - 1, 0, 1),
        end: current.start,
      };
  }
}

const PERIOD_LABELS: Record<Period, string> = {
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
};

export function formatPeriodLabel(period: Period): string {
  return PERIOD_LABELS[period];
}

// Postgres `date` columns are compared as plain YYYY-MM-DD strings.
// Built from local Y/M/D directly — going through `toISOString()` (UTC) would
// shift the date by a day in timezones ahead of UTC.
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

export function formatShortDate(dateString: string): string {
  return SHORT_DATE_FORMATTER.format(new Date(dateString));
}

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatLongDate(date: Date): string {
  return LONG_DATE_FORMATTER.format(date);
}

// Mon-first weeks covering the given month, with `null` for leading/trailing blanks.
export function getCalendarGrid(monthDate: Date): (Date | null)[][] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (firstDay.getDay() + 6) % 7;

  const days: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}
