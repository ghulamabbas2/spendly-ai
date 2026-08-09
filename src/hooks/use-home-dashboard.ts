import { useEffect, useMemo, useState } from 'react';

import {
  formatPeriodLabel,
  formatShortDate,
  getPeriodRange,
  getPreviousPeriodRange,
  type Period,
} from '../lib/date-range';
import { getCategories } from '../services/categories-service';
import { getExpensesInRange, getRecentExpenses } from '../services/expenses-service';
import type { Category } from '../types/category';
import type { Expense } from '../types/expense';

const RECENT_LIMIT = 8;
const TOP_CATEGORY_LIMIT = 4;

export type Comparison =
  | { hasPriorData: false }
  | { hasPriorData: true; percentChange: number; direction: 'increase' | 'decrease' | 'flat' };

export type TopCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  barWidthPercent: number;
};

export type RecentTransaction = {
  id: string;
  title: string;
  categoryName: string;
  icon: string;
  color: string;
  date: string;
  amount: number;
};

export function useHomeDashboard() {
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentExpenses, setCurrentExpenses] = useState<Expense[]>([]);
  const [previousExpenses, setPreviousExpenses] = useState<Expense[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const currentRange = getPeriodRange(period, now);
        const previousRange = getPreviousPeriodRange(period, now);

        const [categoriesData, current, previous, recent] = await Promise.all([
          getCategories(),
          getExpensesInRange(currentRange.start, currentRange.end),
          getExpensesInRange(previousRange.start, previousRange.end),
          getRecentExpenses(RECENT_LIMIT),
        ]);

        if (!active) return;
        setCategories(categoriesData);
        setCurrentExpenses(current);
        setPreviousExpenses(previous);
        setRecentExpenses(recent);
      } catch (e) {
        if (active) setError(e as Error);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [period, reloadToken]);

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(category => map.set(category.id, category));
    return map;
  }, [categories]);

  const totalSpent = useMemo(
    () => currentExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [currentExpenses],
  );

  const previousTotal = useMemo(
    () => previousExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [previousExpenses],
  );

  const comparison = useMemo<Comparison>(() => {
    if (previousTotal === 0) return { hasPriorData: false };
    const percentChange = ((totalSpent - previousTotal) / previousTotal) * 100;
    const direction = percentChange > 0 ? 'increase' : percentChange < 0 ? 'decrease' : 'flat';
    return { hasPriorData: true, percentChange, direction };
  }, [totalSpent, previousTotal]);

  const topCategories = useMemo<TopCategory[]>(() => {
    const totals = new Map<string, number>();
    currentExpenses.forEach(expense => {
      if (!expense.category_id) return;
      totals.set(expense.category_id, (totals.get(expense.category_id) ?? 0) + expense.amount);
    });

    const sorted = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_CATEGORY_LIMIT);
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
          amount,
          barWidthPercent: maxAmount > 0 ? (amount / maxAmount) * 100 : 0,
        },
      ];
    });
  }, [currentExpenses, categoryById]);

  const recentTransactions = useMemo<RecentTransaction[]>(
    () =>
      recentExpenses.map(expense => {
        const category = expense.category_id ? categoryById.get(expense.category_id) : undefined;
        const note = expense.note?.trim();
        return {
          id: expense.id,
          // Schema has no merchant field, so the row title falls back to the category name.
          title: note ? note : (category?.name ?? 'Uncategorized'),
          categoryName: category?.name ?? 'Uncategorized',
          icon: category?.icon ?? 'category',
          color: category?.color ?? '#64748b',
          date: formatShortDate(expense.date),
          amount: expense.amount,
        };
      }),
    [recentExpenses, categoryById],
  );

  return {
    loading,
    error,
    reload: () => setReloadToken(token => token + 1),
    period,
    setPeriod,
    periodLabel: formatPeriodLabel(period),
    totalSpent,
    comparison,
    txnCount: currentExpenses.length,
    topCategories,
    recentTransactions,
    hasAnyExpenses: recentExpenses.length > 0,
  };
}
