# Spendly AI — Database

Backend is **Supabase (Postgres)**. All application data is stored here and accessed through the service layer (`src/services`) — see [`architecture.md`](architecture.md). Every table is protected by **Row-Level Security (RLS)** so a user can only read and write their own rows.

## Conventions

- Primary keys are `uuid` (`gen_random_uuid()`).
- Money is stored as `numeric(12,2)`.
- Timestamps are `timestamptz`, defaulting to `now()`.
- `user_id` references `auth.users(id)` and is the tenant key every RLS policy checks.

## Tables

### `profiles`
One row per user, keyed by the auth user id.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | References `auth.users(id)` |
| `full_name` | `text` | Nullable. Captured at signup from `auth.users.raw_user_meta_data ->> 'full_name'` (see `docs/auth.md`); `null` for accounts created before this column existed |
| `created_at` | `timestamptz` | Default `now()` |

### `categories`
Per-user spending categories, managed by the user. A default set is seeded on signup (see below).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `user_id` | `uuid` | References `auth.users(id)`, `not null` |
| `name` | `text` | `not null` |
| `icon` | `text` | Icon identifier |
| `color` | `text` | Hex color |
| `created_at` | `timestamptz` | Default `now()` |

### `expenses`
One row per expense entry.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `user_id` | `uuid` | References `auth.users(id)`, `not null` |
| `amount` | `numeric(12,2)` | `not null` |
| `category_id` | `uuid` | References `categories(id)` |
| `note` | `text` | Optional |
| `date` | `date` | Expense date, `not null` |
| `created_at` | `timestamptz` | Default `now()` |

## Relationships

- `profiles.id` → `auth.users.id` (1:1)
- `categories.user_id` → `auth.users.id` (many per user)
- `expenses.user_id` → `auth.users.id` (many per user)
- `expenses.category_id` → `categories.id` (each expense belongs to one category)

## Row-Level Security

RLS is **enabled on every table**. Access is scoped to the authenticated user by comparing `auth.uid()` against `user_id` (against `id` for `profiles`). Each table has policies for `select`, `insert`, `update`, and `delete` so a user can only read and write their own rows.

```sql
-- Enable RLS
alter table profiles   enable row level security;
alter table categories enable row level security;
alter table expenses   enable row level security;

-- profiles: keyed by id (= auth user id)
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on profiles for delete using (auth.uid() = id);

-- categories: keyed by user_id
create policy "categories_select_own" on categories for select using (auth.uid() = user_id);
create policy "categories_insert_own" on categories for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete_own" on categories for delete using (auth.uid() = user_id);

-- expenses: keyed by user_id
create policy "expenses_select_own" on expenses for select using (auth.uid() = user_id);
create policy "expenses_insert_own" on expenses for insert with check (auth.uid() = user_id);
create policy "expenses_update_own" on expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expenses_delete_own" on expenses for delete using (auth.uid() = user_id);
```

## Indexes

Both `user_id` (tenant filter on every query) and `date` (expense sorting/date-range filters) are indexed.

```sql
create index expenses_user_id_idx   on expenses (user_id);
create index expenses_date_idx      on expenses (date);
create index categories_user_id_idx on categories (user_id);
```

## Categories: per-user, seeded on signup

Categories are **owned and managed by each user** — they can create, rename, recolor, and delete their own. On signup, a **default set** is seeded for the new user so the app is usable immediately. Seeding runs as a trigger on new-user creation (or in the post-signup service flow) inserting the default categories with the new `user_id`.

```sql
-- Seed default categories for a newly created user
create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.categories (user_id, name, icon, color) values
    (new.id, 'Food',          'restaurant',   '#f97316'),
    (new.id, 'Transport',     'directions_car','#3b82f6'),
    (new.id, 'Shopping',      'shopping_bag', '#ec4899'),
    (new.id, 'Bills',         'receipt_long', '#7c3aed'),
    (new.id, 'Entertainment', 'movie',        '#22c55e'),
    (new.id, 'Health',        'favorite',     '#ef4444'),
    (new.id, 'Other',         'category',     '#64748b');
  return new;
end;
$$;

create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function public.seed_default_categories();
```

> The default names, icons, and colors above are a starting set — align them with `design-system.md` and `ui.md` during build.
