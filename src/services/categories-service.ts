import type { CategoryInput } from '../lib/validation/category-schema';
import type { Category } from '../types/category';
import { supabase } from './supabase-client';

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return data as Category[];
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw new Error(`Failed to create category: ${userError.message}`);
  if (!user) throw new Error('Failed to create category: not signed in');

  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: user.id, name: input.name, icon: input.icon, color: input.color })
    .select('*')
    .single();

  if (error) throw new Error(`Failed to create category: ${error.message}`);
  return data as Category;
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: input.name, icon: input.icon, color: input.color })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to update category: ${error.message}`);
  return data as Category;
}

export async function deleteCategory(
  id: string,
  reassignToCategoryId?: string,
): Promise<void> {
  if (reassignToCategoryId) {
    const { error: reassignError } = await supabase
      .from('expenses')
      .update({ category_id: reassignToCategoryId })
      .eq('category_id', id);

    if (reassignError) {
      throw new Error(`Failed to reassign expenses: ${reassignError.message}`);
    }
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete category: ${error.message}`);
}
