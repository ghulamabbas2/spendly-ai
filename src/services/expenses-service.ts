import { toDateString } from '../lib/date-range';
import type { Expense } from '../types/expense';
import { supabase } from './supabase-client';

export async function getExpensesInRange(start: Date, end: Date): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .gte('date', toDateString(start))
    .lt('date', toDateString(end))
    .order('date', { ascending: false });

  if (error) throw new Error(`Failed to load expenses: ${error.message}`);
  return data as Expense[];
}

export async function getRecentExpenses(limit: number): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load recent expenses: ${error.message}`);
  return data as Expense[];
}

export async function countExpensesByCategory(categoryId: string): Promise<number> {
  const { count, error } = await supabase
    .from('expenses')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (error) throw new Error(`Failed to count expenses: ${error.message}`);
  return count ?? 0;
}
