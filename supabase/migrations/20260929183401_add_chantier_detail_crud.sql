create table public.chantier_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chantier_id uuid not null,
  label text not null check (char_length(btrim(label)) between 1 and 240),
  amount numeric(12, 2) not null check (amount >= 0),
  status text not null default 'TO_CALL' check (status in ('TO_CALL', 'CALLED', 'COLLECTED')),
  call_due_date date,
  reminder_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (chantier_id, user_id)
    references public.chantiers (id, user_id)
    on delete cascade,
  unique (id, user_id)
);

create table public.chantier_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chantier_id uuid not null,
  label text not null check (char_length(btrim(label)) between 1 and 240),
  kind text not null default 'PLUS' check (kind in ('PLUS', 'MINUS')),
  amount numeric(12, 2) not null check (amount >= 0),
  status text not null default 'PROPOSED' check (status in ('PROPOSED', 'ACCEPTED', 'REFUSED')),
  occurred_on date,
  description text not null default '' check (char_length(description) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (chantier_id, user_id)
    references public.chantiers (id, user_id)
    on delete cascade,
  unique (id, user_id)
);

create table public.chantier_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chantier_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 240),
  category text not null default 'OTHER' check (category in ('QUOTE', 'PURCHASE_ORDER', 'INVOICE', 'PLAN', 'PHOTO', 'SUBCONTRACTOR_DOCUMENT', 'ADMINISTRATIVE', 'OTHER')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (chantier_id, user_id)
    references public.chantiers (id, user_id)
    on delete cascade,
  unique (id, user_id)
);

alter table public.chantier_subcontractors
  add column service_description text not null default '' check (char_length(service_description) <= 2000),
  add column forecast_amount numeric(12, 2) check (forecast_amount is null or forecast_amount >= 0),
  add column actual_amount numeric(12, 2) check (actual_amount is null or actual_amount >= 0),
  add column paid_amount numeric(12, 2) not null default 0 check (paid_amount >= 0),
  add column payment_status text not null default 'UNPAID' check (payment_status in ('UNPAID', 'PARTIAL', 'PAID')),
  add column due_date date,
  add column comment text not null default '' check (char_length(comment) <= 4000),
  add column updated_at timestamptz not null default now();

create index chantier_deposits_user_chantier_date_index
  on public.chantier_deposits (user_id, chantier_id, call_due_date);

create index chantier_adjustments_user_chantier_date_index
  on public.chantier_adjustments (user_id, chantier_id, occurred_on);

create index chantier_documents_user_chantier_created_index
  on public.chantier_documents (user_id, chantier_id, created_at desc);

create function public.set_chantier_detail_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_chantier_deposits_updated_at
before update on public.chantier_deposits
for each row execute function public.set_chantier_detail_updated_at();

create trigger set_chantier_adjustments_updated_at
before update on public.chantier_adjustments
for each row execute function public.set_chantier_detail_updated_at();

create trigger set_chantier_documents_updated_at
before update on public.chantier_documents
for each row execute function public.set_chantier_detail_updated_at();

create trigger set_chantier_subcontractors_updated_at
before update on public.chantier_subcontractors
for each row execute function public.set_chantier_detail_updated_at();

alter table public.chantier_deposits enable row level security;
alter table public.chantier_adjustments enable row level security;
alter table public.chantier_documents enable row level security;

revoke all on table public.chantier_deposits from anon, authenticated;
revoke all on table public.chantier_adjustments from anon, authenticated;
revoke all on table public.chantier_documents from anon, authenticated;

grant select, insert, update, delete on table public.chantier_deposits to authenticated;
grant select, insert, update, delete on table public.chantier_adjustments to authenticated;
grant select, insert, update, delete on table public.chantier_documents to authenticated;

create policy "Users manage their own chantier deposits"
  on public.chantier_deposits for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own chantier adjustments"
  on public.chantier_adjustments for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own chantier documents"
  on public.chantier_documents for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on function public.set_chantier_detail_updated_at() from public, anon, authenticated;
