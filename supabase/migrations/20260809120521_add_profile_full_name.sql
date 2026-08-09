-- Add profiles.full_name, populated from auth.users.raw_user_meta_data on signup.
-- See docs/database.md for the source of truth this migration implements.

alter table profiles add column full_name text;

create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name');

  insert into public.categories (user_id, name, icon, color) values
    (new.id, 'Food',          'restaurant',    '#f97316'),
    (new.id, 'Transport',     'directions_car','#3b82f6'),
    (new.id, 'Shopping',      'shopping_bag',  '#ec4899'),
    (new.id, 'Bills',         'receipt_long',  '#7c3aed'),
    (new.id, 'Entertainment', 'movie',         '#22c55e'),
    (new.id, 'Health',        'favorite',      '#ef4444'),
    (new.id, 'Other',         'category',      '#64748b');

  return new;
end;
$$;
