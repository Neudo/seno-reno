create table public.personal_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('PERSONAL_ADVANCE', 'EXPENSE_REPORT')),
  expense_date date not null,
  label text not null check (char_length(btrim(label)) between 1 and 180),
  supplier text not null default '' check (char_length(supplier) <= 180),
  amount numeric(12, 2) not null check (amount > 0),
  scope text not null default 'COMPANY' check (scope = 'COMPANY'),
  planned_reimbursement_date date,
  reimbursed_at date,
  comment text not null default '' check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reimbursed_at is null or reimbursed_at >= expense_date),
  unique (id, user_id)
);

create table public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('MANUAL_INCOME', 'MANUAL_EXPENSE', 'PERSONAL_REIMBURSEMENT')),
  direction text not null check (direction in ('INCOME', 'EXPENSE')),
  label text not null check (char_length(btrim(label)) between 1 and 180),
  amount numeric(12, 2) not null check (amount > 0),
  expected_date date not null,
  actual_date date,
  status text not null default 'PLANNED' check (status in ('PLANNED', 'COMPLETED', 'CANCELLED')),
  comment text not null default '' check (char_length(comment) <= 2000),
  personal_expense_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (kind = 'MANUAL_INCOME' and direction = 'INCOME')
    or (kind in ('MANUAL_EXPENSE', 'PERSONAL_REIMBURSEMENT') and direction = 'EXPENSE')
  ),
  check (
    (status = 'COMPLETED' and actual_date is not null)
    or (status in ('PLANNED', 'CANCELLED') and actual_date is null)
  ),
  check (
    (kind = 'PERSONAL_REIMBURSEMENT' and personal_expense_id is not null and status = 'COMPLETED')
    or (kind <> 'PERSONAL_REIMBURSEMENT' and personal_expense_id is null)
  ),
  foreign key (personal_expense_id, user_id)
    references public.personal_expenses (id, user_id)
    on delete restrict,
  unique (id, user_id)
);

create table public.fixed_costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 180),
  category text not null default '' check (char_length(category) <= 80),
  amount numeric(12, 2) not null check (amount > 0),
  recurrence text not null check (recurrence in ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY')),
  due_day smallint check (due_day between 1 and 31),
  due_date date,
  start_date date not null default current_date,
  end_date date,
  comment text not null default '' check (char_length(comment) <= 2000),
  is_active boolean not null default true,
  reminder_days_before smallint not null default 3 check (reminder_days_before between 0 and 365),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_day is not null or due_date is not null),
  check (end_date is null or end_date >= start_date),
  unique (id, user_id)
);

create index personal_expenses_user_reimbursement_index
  on public.personal_expenses (user_id, reimbursed_at, planned_reimbursement_date);

create index cash_movements_user_status_expected_index
  on public.cash_movements (user_id, status, expected_date);

create index cash_movements_user_expected_index
  on public.cash_movements (user_id, expected_date);

create index fixed_costs_user_active_name_index
  on public.fixed_costs (user_id, is_active, name);

create function public.set_finance_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_personal_expenses_updated_at
before update on public.personal_expenses
for each row execute function public.set_finance_updated_at();

create trigger set_cash_movements_updated_at
before update on public.cash_movements
for each row execute function public.set_finance_updated_at();

create trigger set_fixed_costs_updated_at
before update on public.fixed_costs
for each row execute function public.set_finance_updated_at();

alter table public.personal_expenses enable row level security;
alter table public.cash_movements enable row level security;
alter table public.fixed_costs enable row level security;

revoke all on table public.personal_expenses from anon, authenticated;
revoke all on table public.cash_movements from anon, authenticated;
revoke all on table public.fixed_costs from anon, authenticated;

grant select, insert, update, delete on table public.personal_expenses to authenticated;
grant select, insert, update, delete on table public.cash_movements to authenticated;
grant select, insert, update, delete on table public.fixed_costs to authenticated;

create policy "Users manage their own personal expenses"
  on public.personal_expenses for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own cash movements"
  on public.cash_movements for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own fixed costs"
  on public.fixed_costs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.reimburse_personal_expense(
  target_personal_expense_id uuid,
  reimbursement_date date default current_date
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  personal_expense_row public.personal_expenses%rowtype;
  movement_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to reimburse a personal expense'
      using errcode = '42501';
  end if;

  if reimbursement_date is null then
    raise exception 'A reimbursement date is required'
      using errcode = '22004';
  end if;

  select * into personal_expense_row
  from public.personal_expenses
  where id = target_personal_expense_id
    and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Personal expense not found' using errcode = 'P0002';
  end if;

  if reimbursement_date < personal_expense_row.expense_date then
    raise exception 'A reimbursement cannot precede the expense'
      using errcode = '22007';
  end if;

  select id into movement_id
  from public.cash_movements
  where personal_expense_id = personal_expense_row.id
    and user_id = (select auth.uid());

  if found then
    if personal_expense_row.reimbursed_at is null then
      update public.personal_expenses
      set reimbursed_at = reimbursement_date
      where id = personal_expense_row.id
        and user_id = (select auth.uid());
    end if;

    return movement_id;
  end if;

  insert into public.cash_movements (
    user_id,
    kind,
    direction,
    label,
    amount,
    expected_date,
    actual_date,
    status,
    personal_expense_id
  ) values (
    personal_expense_row.user_id,
    'PERSONAL_REIMBURSEMENT',
    'EXPENSE',
    'Remboursement PE — ' || personal_expense_row.label,
    personal_expense_row.amount,
    coalesce(personal_expense_row.planned_reimbursement_date, reimbursement_date),
    reimbursement_date,
    'COMPLETED',
    personal_expense_row.id
  ) returning id into movement_id;

  update public.personal_expenses
  set reimbursed_at = reimbursement_date
  where id = personal_expense_row.id
    and user_id = (select auth.uid());

  return movement_id;
end;
$$;

revoke all on function public.set_finance_updated_at() from public;
revoke execute on function public.set_finance_updated_at() from anon, authenticated;
revoke all on function public.reimburse_personal_expense(uuid, date) from public;
revoke all on function public.reimburse_personal_expense(uuid, date) from anon;
grant execute on function public.reimburse_personal_expense(uuid, date) to authenticated;
