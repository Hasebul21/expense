-- Expense Tracker — Supabase schema + Row-Level Security.
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query) once.
-- RLS is what enforces authorization: each row is owned by a user, and the
-- policies make it impossible to read or write another user's rows.

-- ── Expenses ────────────────────────────────────────────────────────────────
create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade
                 default auth.uid(),
  amount       numeric(14, 2) not null check (amount >= 0),
  category     text not null,
  date         date not null,
  target_month text not null,           -- yyyy-mm the expense is budgeted to
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists expenses_user_month_idx
  on public.expenses (user_id, target_month);

alter table public.expenses enable row level security;

drop policy if exists "Users manage their own expenses" on public.expenses;
create policy "Users manage their own expenses"
  on public.expenses
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Budgets (one amount per user per month) ──────────────────────────────────
create table if not exists public.budgets (
  user_id uuid not null references auth.users (id) on delete cascade
            default auth.uid(),
  month   text not null,                -- yyyy-mm
  amount  numeric(14, 2) not null check (amount >= 0),
  primary key (user_id, month)
);

alter table public.budgets enable row level security;

drop policy if exists "Users manage their own budgets" on public.budgets;
create policy "Users manage their own budgets"
  on public.budgets
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
