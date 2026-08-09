import { useEffect, useMemo, useState } from 'react';

import { formatLongDate } from '../lib/date-range';
import {
  biggestCategories,
  buildCategoryBreakdown,
  bucketSpendOverTime,
} from '../lib/insights';
import { getCategories } from '../services/categories-service';
import { getExpensesInRange } from '../services/expenses-service';
import type { Category } from '../types/category';
import type { Expense } from '../types/expense';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function useInsights() {
  const [rangeStart, setRangeStartState] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [rangeEnd, setRangeEndState] = useState(() => startOfDay(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // `getExpensesInRange` treats the end as exclusive, so add a day to make TO inclusive.
  const endExclusive = useMemo(() => addDays(rangeEnd, 1), [rangeEnd]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [categoriesData, expensesData] = await Promise.all([
          getCategories(),
          getExpensesInRange(rangeStart, endExclusive),
        ]);

        if (!active) return;
        setCategories(categoriesData);
        setExpenses(expensesData);
      } catch (e) {
        if (active) setError(e as Error);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [rangeStart, endExclusive, reloadToken]);

  // Collapse an inverted range to the picked day, per the prototype's calendar rule.
  function setRangeStart(date: Date) {
    const next = startOfDay(date);
    setRangeStartState(next);
    if (next.getTime() > rangeEnd.getTime()) setRangeEndState(next);
  }

  function setRangeEnd(date: Date) {
    const next = startOfDay(date);
    setRangeEndState(next);
    if (next.getTime() < rangeStart.getTime()) setRangeStartState(next);
  }

  const rangeTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  const chartBuckets = useMemo(
    () => bucketSpendOverTime(expenses, rangeStart, endExclusive),
    [expenses, rangeStart, endExclusive],
  );

  const breakdown = useMemo(
    () => buildCategoryBreakdown(expenses, categories),
    [expenses, categories],
  );

  const biggest = useMemo(() => biggestCategories(breakdown), [breakdown]);

  return {
    loading,
    error,
    reload: () => setReloadToken(token => token + 1),
    rangeStart,
    rangeEnd,
    setRangeStart,
    setRangeEnd,
    rangeStartLabel: formatLongDate(rangeStart),
    rangeEndLabel: formatLongDate(rangeEnd),
    rangeTotal,
    rangeCount: expenses.length,
    chartBuckets,
    breakdown,
    biggest,
    hasExpenses: expenses.length > 0,
  };
}
