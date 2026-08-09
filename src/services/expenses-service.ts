import { toDateString } from '../lib/date-range';
import type { ExpenseInput } from '../lib/validation/expense-schema';
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

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw new Error(`Failed to create expense: ${userError.message}`);
  if (!user) throw new Error('Failed to create expense: not signed in');

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      amount: input.amount,
      category_id: input.categoryId,
      note: input.note?.trim() || null,
      date: input.date,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Failed to create expense: ${error.message}`);
  return data as Expense;
}
