import { hexToRgba } from './color';
import { formatShortDate, fromDateString, toDateString } from './date-range';
import type { Category } from '../types/category';
import type { Expense } from '../types/expense';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_BUCKETS = 8;
const CATEGORY_TINT_ALPHA = 0.13;

export type SpendBucket = {
  label: string;
  total: number;
};

export type BreakdownItem = {
  id: string;
  name: string;
  icon: string;
  color: string;
  tint: string;
  amount: number;
  pct: number;
  barWidthPercent: number;
};

export type BiggestCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  tint: string;
  amount: number;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(start: Date, end: Date): number {
  return Math.round(
    (startOfDay(end).getTime() - startOfDay(start).getTime()) / MS_PER_DAY,
  );
}

// Splits [start, endExclusive) into at most 8 buckets: weekly while the range fits in
// 8 weeks, otherwise equal-width buckets sized to cover the whole range in 8 columns.
export function bucketSpendOverTime(
  expenses: Expense[],
  start: Date,
  endExclusive: Date,
): SpendBucket[] {
  const totalDays = Math.max(1, daysBetween(start, endExclusive));
  const weeks = Math.ceil(totalDays / 7);
  const bucketCount = weeks <= MAX_BUCKETS ? weeks : MAX_BUCKETS;
  const bucketDays =
    weeks <= MAX_BUCKETS ? 7 : Math.ceil(totalDays / MAX_BUCKETS);

  const rangeStart = startOfDay(start);
  const buckets: SpendBucket[] = Array.from(
    { length: bucketCount },
    (_, index) => {
      const bucketStart = new Date(
        rangeStart.getTime() + index * bucketDays * MS_PER_DAY,
      );
      return { label: formatShortDate(toDateString(bucketStart)), total: 0 };
    },
  );

  expenses.forEach(expense => {
    const offset = daysBetween(rangeStart, fromDateString(expense.date));
    const index = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor(offset / bucketDays)),
    );
    buckets[index].total += expense.amount;
  });

  return buckets;
}

// All categories with spend in range, sorted by amount desc. `pct` is the share of the
// categorized total; `barWidthPercent` is normalized to the largest category (as on Home).
export function buildCategoryBreakdown(
  expenses: Expense[],
  categories: Category[],
): BreakdownItem[] {
  const categoryById = new Map(
    categories.map(category => [category.id, category]),
  );

  const totals = new Map<string, number>();
  let categorizedTotal = 0;
  expenses.forEach(expense => {
    if (!expense.category_id) return;
    totals.set(
      expense.category_id,
      (totals.get(expense.category_id) ?? 0) + expense.amount,
    );
    categorizedTotal += expense.amount;
  });

  const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  const maxAmount = sorted[0]?.[1] ?? 0;

  return sorted.flatMap(([categoryId, amount]) => {
    const category = categoryById.get(categoryId);
    if (!category) return [];
    return [
      {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        tint: hexToRgba(category.color, CATEGORY_TINT_ALPHA),
        amount,
        pct:
          categorizedTotal > 0
            ? Math.round((amount / categorizedTotal) * 100)
            : 0,
        barWidthPercent: maxAmount > 0 ? (amount / maxAmount) * 100 : 0,
      },
    ];
  });
}

export function biggestCategories(
  breakdown: BreakdownItem[],
  count = 3,
): BiggestCategory[] {
  return breakdown.slice(0, count).map(item => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
    color: item.color,
    tint: item.tint,
    amount: item.amount,
  }));
}
