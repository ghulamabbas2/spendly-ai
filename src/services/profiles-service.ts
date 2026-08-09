import type { Profile } from '../types/profile';
import { supabase } from './supabase-client';

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  return {
    id: data.id,
    fullName: data.full_name,
    createdAt: data.created_at,
  };
}
