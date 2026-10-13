create table public.chantier_procurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chantier_id uuid not null,
  kind text not null check (kind in ('PURCHASE', 'ORDER')),
  title text not null check (char_length(btrim(title)) between 1 and 240),
  quantity numeric(12, 3) check (quantity is null or quantity >= 0),
  forecast_amount numeric(12, 2) check (forecast_amount is null or forecast_amount >= 0),
  supplier text not null default '' check (char_length(supplier) <= 240),
  order_status text check (order_status in ('TO_ORDER', 'ORDERED', 'READY', 'RECEIVED', 'CANCELLED')),
  payment_status text check (payment_status in ('UNPAID', 'PARTIAL', 'PAID')),
  ordered_at date,
  planned_delivery_date date,
  description text not null default '' check (char_length(description) <= 4000),
  add_to_shopping_list boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind <> 'ORDER' or forecast_amount is not null),
  foreign key (chantier_id, user_id)
    references public.chantiers (id, user_id)
    on delete cascade,
  unique (id, user_id)
);

create index chantier_procurements_user_chantier_created_index
  on public.chantier_procurements (user_id, chantier_id, created_at desc);

create function public.set_chantier_procurements_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_chantier_procurements_updated_at
before update on public.chantier_procurements
for each row execute function public.set_chantier_procurements_updated_at();

alter table public.chantier_procurements enable row level security;

revoke all on table public.chantier_procurements from anon, authenticated;
grant select, insert, update, delete on table public.chantier_procurements to authenticated;

create policy "Users manage their own chantier procurements"
  on public.chantier_procurements for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on function public.set_chantier_procurements_updated_at() from public, anon, authenticated;
