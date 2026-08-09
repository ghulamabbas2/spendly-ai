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

export async function getExpenseById(id: string): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to load expense: ${error.message}`);
  return data as Expense;
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

export async function updateExpense(id: string, input: ExpenseInput): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      amount: input.amount,
      category_id: input.categoryId,
      note: input.note?.trim() || null,
      date: input.date,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to update expense: ${error.message}`);
  return data as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);

  if (error) throw new Error(`Failed to delete expense: ${error.message}`);
}
