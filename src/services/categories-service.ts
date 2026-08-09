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
