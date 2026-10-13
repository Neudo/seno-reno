create table public.subcontractors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 240),
  contact_name text not null default '' check (char_length(contact_name) <= 160),
  email text not null default '' check (char_length(email) <= 320),
  phone text not null default '' check (char_length(phone) <= 40),
  address text not null default '' check (char_length(address) <= 300),
  postal_code text not null default '' check (char_length(postal_code) <= 20),
  city text not null default '' check (char_length(city) <= 100),
  notes text not null default '' check (char_length(notes) <= 4000),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.chantier_subcontractors (
  chantier_id uuid not null,
  subcontractor_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (chantier_id, subcontractor_id),
  foreign key (chantier_id, user_id)
    references public.chantiers (id, user_id)
    on delete cascade,
  foreign key (subcontractor_id, user_id)
    references public.subcontractors (id, user_id)
    on delete restrict
);

create index subcontractors_user_archived_name_index
  on public.subcontractors (user_id, is_archived, name);

create index chantier_subcontractors_user_chantier_index
  on public.chantier_subcontractors (user_id, chantier_id);

create index chantier_subcontractors_subcontractor_user_index
  on public.chantier_subcontractors (subcontractor_id, user_id);

create function public.set_subcontractors_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_subcontractors_updated_at
before update on public.subcontractors
for each row execute function public.set_subcontractors_updated_at();

alter table public.subcontractors enable row level security;
alter table public.chantier_subcontractors enable row level security;

revoke all on table public.subcontractors from anon, authenticated;
revoke all on table public.chantier_subcontractors from anon, authenticated;

grant select, insert, update, delete on table public.subcontractors to authenticated;
grant select, insert, update, delete on table public.chantier_subcontractors to authenticated;

create policy "Users manage their own subcontractors"
  on public.subcontractors for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own chantier subcontractors"
  on public.chantier_subcontractors for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.replace_chantier_subcontractors(
  target_chantier_id uuid,
  selected_subcontractor_ids uuid[] default array[]::uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  selected_count integer;
  owned_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to assign subcontractors'
      using errcode = '42501';
  end if;

  perform 1
  from public.chantiers
  where id = target_chantier_id
    and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Chantier not found' using errcode = 'P0002';
  end if;

  with selected as (
    select distinct subcontractor_id
    from unnest(coalesce(selected_subcontractor_ids, array[]::uuid[])) as selected_input(subcontractor_id)
  )
  select count(*) into selected_count
  from selected;

  with selected as (
    select distinct subcontractor_id
    from unnest(coalesce(selected_subcontractor_ids, array[]::uuid[])) as selected_input(subcontractor_id)
  )
  select count(*) into owned_count
  from selected
  join public.subcontractors
    on subcontractors.id = selected.subcontractor_id
   and subcontractors.user_id = (select auth.uid());

  if selected_count <> owned_count then
    raise exception 'One or more subcontractors are unavailable'
      using errcode = '22023';
  end if;

  delete from public.chantier_subcontractors
  where chantier_id = target_chantier_id
    and user_id = (select auth.uid());

  insert into public.chantier_subcontractors (
    chantier_id,
    subcontractor_id,
    user_id
  )
  select
    target_chantier_id,
    selected.subcontractor_id,
    (select auth.uid())
  from (
    select distinct subcontractor_id
    from unnest(coalesce(selected_subcontractor_ids, array[]::uuid[])) as selected_input(subcontractor_id)
  ) as selected;
end;
$$;

revoke all on function public.set_subcontractors_updated_at() from public, anon, authenticated;
revoke all on function public.replace_chantier_subcontractors(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.replace_chantier_subcontractors(uuid, uuid[]) to authenticated;
