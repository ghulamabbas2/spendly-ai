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
export function toDateString(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

export function formatShortDate(dateString: string): string {
  return SHORT_DATE_FORMATTER.format(new Date(dateString));
}
