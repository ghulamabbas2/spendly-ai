-- Spendly AI initial schema: profiles, categories, expenses
-- See docs/database.md for the source of truth this migration implements.

create table profiles (
  id uuid primary key references auth.users (id),
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  name text not null,
  icon text,
  color text,
  created_at timestamptz not null default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  amount numeric(12, 2) not null,
  category_id uuid references categories (id),
  note text,
  date date not null,
  created_at timestamptz not null default now()
);

create index expenses_user_id_idx on expenses (user_id);
create index expenses_date_idx on expenses (date);
create index categories_user_id_idx on categories (user_id);

-- Row-Level Security

alter table profiles enable row level security;
alter table categories enable row level security;
alter table expenses enable row level security;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on profiles for delete using (auth.uid() = id);

create policy "categories_select_own" on categories for select using (auth.uid() = user_id);
create policy "categories_insert_own" on categories for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete_own" on categories for delete using (auth.uid() = user_id);

create policy "expenses_select_own" on expenses for select using (auth.uid() = user_id);
create policy "expenses_insert_own" on expenses for insert with check (auth.uid() = user_id);
create policy "expenses_update_own" on expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expenses_delete_own" on expenses for delete using (auth.uid() = user_id);

-- New auth user: create profile row and seed default categories

create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);

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

create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function public.seed_default_categories();
