create table public.chantiers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 240),
  address text not null default '' check (char_length(address) <= 500),
  status text not null default 'PENDING' check (status in ('PENDING', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED')),
  planned_start_date date,
  planned_end_date date,
  actual_end_date date,
  initial_signed_quote_amount numeric(12, 2) check (initial_signed_quote_amount is null or initial_signed_quote_amount >= 0),
  initial_quote_id uuid unique,
  notes text not null default '' check (char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (planned_end_date is null or planned_start_date is null or planned_end_date >= planned_start_date),
  foreign key (client_id, user_id)
    references public.clients (id, user_id)
    on delete restrict,
  foreign key (initial_quote_id, user_id)
    references public.quotes (id, user_id)
    on delete restrict,
  unique (id, user_id)
);

alter table public.quotes
  add column chantier_id uuid;

alter table public.quotes
  add constraint quotes_chantier_id_user_id_fkey
  foreign key (chantier_id, user_id)
  references public.chantiers (id, user_id)
  on delete restrict;

create unique index quotes_chantier_id_unique
  on public.quotes (chantier_id)
  where chantier_id is not null;

create index chantiers_user_status_planned_start_index
  on public.chantiers (user_id, status, planned_start_date);

create index chantiers_client_user_index
  on public.chantiers (client_id, user_id);

create index chantiers_initial_quote_user_index
  on public.chantiers (initial_quote_id, user_id)
  where initial_quote_id is not null;

create index quotes_chantier_user_index
  on public.quotes (chantier_id, user_id)
  where chantier_id is not null;

create function public.set_chantiers_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_chantiers_updated_at
before update on public.chantiers
for each row execute function public.set_chantiers_updated_at();

alter table public.chantiers enable row level security;

revoke all on table public.chantiers from anon, authenticated;
grant select, insert, update, delete on table public.chantiers to authenticated;

create policy "Users manage their own chantiers"
  on public.chantiers for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.create_chantier_from_quote(target_quote_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  quote_row public.quotes%rowtype;
  new_chantier_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to create a chantier'
      using errcode = '42501';
  end if;

  select * into quote_row
  from public.quotes
  where id = target_quote_id
    and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;

  if quote_row.status <> 'SIGNED' then
    raise exception 'Only signed quotes can create a chantier'
      using errcode = '22023';
  end if;

  if quote_row.client_id is null then
    raise exception 'A client must be linked to the quote before creating a chantier'
      using errcode = '22023';
  end if;

  if quote_row.chantier_id is not null then
    return quote_row.chantier_id;
  end if;

  insert into public.chantiers (
    user_id,
    client_id,
    name,
    address,
    initial_signed_quote_amount,
    initial_quote_id
  ) values (
    quote_row.user_id,
    quote_row.client_id,
    coalesce(nullif(btrim(quote_row.title), ''), 'Devis ' || quote_row.quote_number),
    quote_row.project_address,
    quote_row.total_ht,
    quote_row.id
  ) returning id into new_chantier_id;

  update public.quotes
  set chantier_id = new_chantier_id
  where id = quote_row.id
    and user_id = (select auth.uid());

  return new_chantier_id;
end;
$$;

revoke all on function public.set_chantiers_updated_at() from public, anon, authenticated;
revoke all on function public.create_chantier_from_quote(uuid) from public, anon, authenticated;
grant execute on function public.create_chantier_from_quote(uuid) to authenticated;
