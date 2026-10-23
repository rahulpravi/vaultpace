-- ============================================================================
-- Replica Schema: FundTracker (A privacy-focused rebuild of Cashew)
-- Database: PostgreSQL 15+ (Compatible with Supabase, Neon, or self-hosted)
-- Currency & Amounts: Stored as integer cents (e.g., $14.50 = 1450)
-- Access Security: PostgreSQL Row Level Security (RLS) enabled on all tables
-- ============================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. USERS / PROFILES
-- ============================================================================
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  theme_mode text not null default 'system'
    check (theme_mode in ('system', 'light', 'dark')),
  accent_color text not null default '#10B981', -- Default emerald green
  default_currency text not null default 'USD',
  first_day_of_week integer not null default 1
    check (first_day_of_week in (0, 1, 6)), -- 0: Sunday, 1: Monday, 6: Saturday
  biometrics_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. ACCOUNTS
-- Distinct financial pools: Cash, Checking, Savings, Credit Card
-- ============================================================================
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  account_type text not null default 'cash'
    check (account_type in ('cash', 'bank', 'credit', 'savings', 'investment')),
  currency text not null default 'USD',
  initial_balance integer not null default 0, -- Cents (can be negative for credit cards)
  color text not null default '#10B981',
  icon text not null default 'wallet',
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_name_not_empty check (char_length(trim(name)) > 0)
);

create index if not exists idx_accounts_user on accounts(user_id) where not is_archived;
create index if not exists idx_accounts_sort on accounts(user_id, sort_order);

-- ============================================================================
-- 3. CATEGORIES
-- Spending and revenue taxonomy with distinct colors and vector icons
-- ============================================================================
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  category_type text not null default 'expense'
    check (category_type in ('expense', 'income')),
  color text not null default '#3B82F6',
  icon text not null default 'tag',
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint category_name_not_empty check (char_length(trim(name)) > 0),
  constraint unique_user_category unique (user_id, name, category_type)
);

create index if not exists idx_categories_user_type on categories(user_id, category_type, sort_order);

-- ============================================================================
-- 4. BUDGETS
-- Spending thresholds over dynamic cycles (weekly, monthly, yearly, custom)
-- ============================================================================
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  amount_limit integer not null, -- Cents
  period_type text not null default 'monthly'
    check (period_type in ('weekly', 'monthly', 'yearly', 'custom')),
  start_date date not null,
  end_date date, -- Nullable for recurring weekly/monthly periods
  notify_threshold numeric(4,2) not null default 0.80
    check (notify_threshold > 0.0 and notify_threshold <= 1.0),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_limit_positive check (amount_limit > 0),
  constraint budget_date_range check (end_date is null or end_date >= start_date)
);

create index if not exists idx_budgets_user on budgets(user_id) where not is_archived;

-- Junction: Budgets to Categories (Empty set = all categories tracked)
create table if not exists budget_categories (
  budget_id uuid not null references budgets(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (budget_id, category_id)
);

create index if not exists idx_budget_categories_cat on budget_categories(category_id);

-- Junction: Budgets to Accounts (Empty set = all accounts tracked)
create table if not exists budget_accounts (
  budget_id uuid not null references budgets(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  primary key (budget_id, account_id)
);

create index if not exists idx_budget_accounts_acc on budget_accounts(account_id);

-- ============================================================================
-- 5. TRANSACTIONS
-- The central ledger: expenses, incomes, and account transfers
-- ============================================================================
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete restrict,
  category_id uuid references categories(id) on delete set null,
  transaction_type text not null
    check (transaction_type in ('expense', 'income', 'transfer')),
  amount integer not null, -- Cents, strictly positive
  transaction_date date not null, -- Local calendar date of expense
  transaction_time time not null default '12:00:00',
  notes text,
  to_account_id uuid references accounts(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tx_amount_positive check (amount > 0),
  constraint tx_transfer_valid check (
    (transaction_type = 'transfer' and to_account_id is not null and to_account_id <> account_id) or
    (transaction_type in ('expense', 'income') and to_account_id is null)
  ),
  constraint tx_category_presence check (
    transaction_type = 'transfer' or category_id is not null
  )
);

create index if not exists idx_tx_user_date on transactions(user_id, transaction_date desc, transaction_time desc);
create index if not exists idx_tx_account on transactions(account_id);
create index if not exists idx_tx_to_account on transactions(to_account_id) where to_account_id is not null;
create index if not exists idx_tx_category on transactions(category_id);
create index if not exists idx_tx_type on transactions(user_id, transaction_type);

-- ============================================================================
-- 6. RECURRING SUBSCRIPTIONS & RULES (Could-have feature)
-- ============================================================================
create table if not exists recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  transaction_type text not null default 'expense'
    check (transaction_type in ('expense', 'income')),
  amount integer not null check (amount > 0),
  interval_unit text not null
    check (interval_unit in ('day', 'week', 'month', 'year')),
  interval_count integer not null default 1 check (interval_count > 0),
  next_run_date date not null,
  end_date date,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_recurring_due on recurring_rules(next_run_date) where is_active;

-- ============================================================================
-- 7. COMPUTED VIEWS
-- Live calculation of account balances and net worth
-- ============================================================================
create or replace view account_balances as
select
  a.id as account_id,
  a.user_id,
  a.name,
  a.account_type,
  a.currency,
  a.initial_balance,
  (
    a.initial_balance
    + coalesce(sum(case when t.transaction_type = 'income' and t.account_id = a.id then t.amount else 0 end), 0)
    - coalesce(sum(case when t.transaction_type = 'expense' and t.account_id = a.id then t.amount else 0 end), 0)
    - coalesce(sum(case when t.transaction_type = 'transfer' and t.account_id = a.id then t.amount else 0 end), 0)
    + coalesce(sum(case when t.transaction_type = 'transfer' and t.to_account_id = a.id then t.amount else 0 end), 0)
  ) as current_balance
from accounts a
left join transactions t on (t.account_id = a.id or t.to_account_id = a.id)
group by a.id, a.user_id, a.name, a.account_type, a.currency, a.initial_balance;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Zero cross-tenant leakage: Each user strictly accesses their own rows
-- ============================================================================
alter table users enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table budgets enable row level security;
alter table budget_categories enable row level security;
alter table budget_accounts enable row level security;
alter table transactions enable row level security;
alter table recurring_rules enable row level security;

-- Users policy
create policy "users_manage_own" on users
  for all using (auth.uid() = id);

-- Accounts policy
create policy "accounts_manage_own" on accounts
  for all using (auth.uid() = user_id);

-- Categories policy
create policy "categories_manage_own" on categories
  for all using (auth.uid() = user_id);

-- Budgets policy
create policy "budgets_manage_own" on budgets
  for all using (auth.uid() = user_id);

-- Budget categories policy
create policy "budget_categories_manage_own" on budget_categories
  for all using (
    exists (
      select 1 from budgets b where b.id = budget_categories.budget_id and b.user_id = auth.uid()
    )
  );

-- Budget accounts policy
create policy "budget_accounts_manage_own" on budget_accounts
  for all using (
    exists (
      select 1 from budgets b where b.id = budget_accounts.budget_id and b.user_id = auth.uid()
    )
  );

-- Transactions policy
create policy "transactions_manage_own" on transactions
  for all using (auth.uid() = user_id);

-- Recurring rules policy
create policy "recurring_rules_manage_own" on recurring_rules
  for all using (auth.uid() = user_id);

-- ============================================================================
-- 9. AUTOMATIC TIMESTAMP TRIGGER
-- ============================================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated_at before update on users
  for each row execute function update_updated_at_column();
create trigger trg_accounts_updated_at before update on accounts
  for each row execute function update_updated_at_column();
create trigger trg_categories_updated_at before update on categories
  for each row execute function update_updated_at_column();
create trigger trg_budgets_updated_at before update on budgets
  for each row execute function update_updated_at_column();
create trigger trg_transactions_updated_at before update on transactions
  for each row execute function update_updated_at_column();
create trigger trg_recurring_rules_updated_at before update on recurring_rules
  for each row execute function update_updated_at_column();
