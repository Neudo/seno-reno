create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'PERSON' check (kind in ('PERSON', 'COMPANY')),
  first_name text not null default '' check (char_length(first_name) <= 80),
  last_name text not null default '' check (char_length(last_name) <= 100),
  company_name text not null default '' check (char_length(company_name) <= 160),
  primary_contact text not null default '' check (char_length(primary_contact) <= 160),
  email text not null default '' check (char_length(email) <= 320),
  phone text not null default '' check (char_length(phone) <= 40),
  address text not null default '' check (char_length(address) <= 300),
  postal_code text not null default '' check (char_length(postal_code) <= 20),
  city text not null default '' check (char_length(city) <= 100),
  source_kind text not null default 'OTHER' check (source_kind in ('WEBSITE', 'INSTAGRAM', 'LINKEDIN', 'RECOMMENDATION', 'FORMER_CLIENT', 'EVENT', 'PROFESSIONAL_NETWORK', 'OTHER')),
  source_detail text not null default '' check (char_length(source_detail) <= 240),
  notes text not null default '' check (char_length(notes) <= 4000),
  onedrive_url text not null default '' check (char_length(onedrive_url) <= 2048),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (kind = 'PERSON' and char_length(btrim(last_name)) >= 1)
    or (kind = 'COMPANY' and char_length(btrim(company_name)) >= 1)
  ),
  unique (id, user_id)
);

create table public.prospecting_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 180),
  type text not null default '' check (char_length(type) <= 100),
  location text not null default '' check (char_length(location) <= 180),
  event_date date,
  status text not null default 'PLANNED' check (status in ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  comment text not null default '' check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.prospecting_communications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 180),
  channel text not null default '' check (char_length(channel) <= 100),
  period_label text not null default '' check (char_length(period_label) <= 120),
  status text not null default 'PLANNED' check (status in ('ACTIVE', 'COMPLETED', 'PAUSED', 'PLANNED')),
  comment text not null default '' check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'PERSON' check (kind in ('PERSON', 'COMPANY')),
  first_name text not null default '' check (char_length(first_name) <= 80),
  last_name text not null default '' check (char_length(last_name) <= 100),
  company_name text not null default '' check (char_length(company_name) <= 160),
  email text not null default '' check (char_length(email) <= 320),
  phone text not null default '' check (char_length(phone) <= 40),
  postal_code text not null default '' check (char_length(postal_code) <= 20),
  city text not null default '' check (char_length(city) <= 100),
  status text not null default 'NEW' check (status in ('NEW', 'TO_CONTACT', 'CONTACTED', 'TO_FOLLOW_UP', 'IN_DISCUSSION', 'CLOSED', 'CONVERTED')),
  priority text not null default 'MEDIUM' check (priority in ('HIGH', 'MEDIUM', 'LOW')),
  source_kind text not null default 'OTHER' check (source_kind in ('WEBSITE', 'INSTAGRAM', 'LINKEDIN', 'RECOMMENDATION', 'FORMER_CLIENT', 'EVENT', 'PROFESSIONAL_NETWORK', 'OTHER')),
  source_detail text not null default '' check (char_length(source_detail) <= 240),
  origin_event_id uuid,
  origin_communication_id uuid,
  next_follow_up_at date,
  last_interaction_at timestamptz,
  notes text not null default '' check (char_length(notes) <= 4000),
  converted_client_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (kind = 'PERSON' and char_length(btrim(last_name)) >= 1)
    or (kind = 'COMPANY' and char_length(btrim(company_name)) >= 1)
  ),
  foreign key (origin_event_id, user_id)
    references public.prospecting_events (id, user_id)
    on delete restrict,
  foreign key (origin_communication_id, user_id)
    references public.prospecting_communications (id, user_id)
    on delete restrict,
  foreign key (converted_client_id, user_id)
    references public.clients (id, user_id)
    on delete restrict,
  unique (id, user_id)
);

create table public.prospect_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prospect_id uuid not null,
  type text not null check (type in ('CALL', 'EMAIL', 'MEETING', 'MESSAGE', 'NOTE', 'OTHER')),
  note text not null default '' check (char_length(note) <= 4000),
  occurred_at timestamptz not null default now(),
  next_follow_up_at date,
  created_at timestamptz not null default now(),
  foreign key (prospect_id, user_id)
    references public.prospects (id, user_id)
    on delete cascade
);

create table public.prospect_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 180),
  city text not null default '' check (char_length(city) <= 100),
  email text not null default '' check (char_length(email) <= 320),
  phone text not null default '' check (char_length(phone) <= 40),
  note text not null default '' check (char_length(note) <= 2000),
  converted_client_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (converted_client_id, user_id)
    references public.clients (id, user_id)
    on delete restrict,
  unique (id, user_id)
);

create index clients_user_archived_updated_index
  on public.clients (user_id, is_archived, updated_at desc);

create index prospects_user_status_follow_up_index
  on public.prospects (user_id, status, next_follow_up_at);

create index prospects_user_source_index
  on public.prospects (user_id, source_kind);

create index prospects_origin_event_user_index
  on public.prospects (origin_event_id, user_id);

create index prospects_origin_communication_user_index
  on public.prospects (origin_communication_id, user_id);

create index prospects_converted_client_user_index
  on public.prospects (converted_client_id, user_id);

create index prospect_interactions_prospect_user_occurred_index
  on public.prospect_interactions (prospect_id, user_id, occurred_at desc);

create index prospect_interactions_user_index
  on public.prospect_interactions (user_id);

create index prospecting_events_user_status_date_index
  on public.prospecting_events (user_id, status, event_date desc);

create index prospecting_communications_user_status_index
  on public.prospecting_communications (user_id, status, updated_at desc);

create index prospect_ideas_converted_client_user_index
  on public.prospect_ideas (converted_client_id, user_id);

create index prospect_ideas_user_index
  on public.prospect_ideas (user_id);

create function public.set_clients_prospecting_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_clients_prospecting_updated_at();

create trigger set_prospecting_events_updated_at
before update on public.prospecting_events
for each row execute function public.set_clients_prospecting_updated_at();

create trigger set_prospecting_communications_updated_at
before update on public.prospecting_communications
for each row execute function public.set_clients_prospecting_updated_at();

create trigger set_prospects_updated_at
before update on public.prospects
for each row execute function public.set_clients_prospecting_updated_at();

create trigger set_prospect_ideas_updated_at
before update on public.prospect_ideas
for each row execute function public.set_clients_prospecting_updated_at();

alter table public.clients enable row level security;
alter table public.prospecting_events enable row level security;
alter table public.prospecting_communications enable row level security;
alter table public.prospects enable row level security;
alter table public.prospect_interactions enable row level security;
alter table public.prospect_ideas enable row level security;

revoke all on table public.clients from anon, authenticated;
revoke all on table public.prospecting_events from anon, authenticated;
revoke all on table public.prospecting_communications from anon, authenticated;
revoke all on table public.prospects from anon, authenticated;
revoke all on table public.prospect_interactions from anon, authenticated;
revoke all on table public.prospect_ideas from anon, authenticated;

grant select, insert, update, delete on table public.clients to authenticated;
grant select, insert, update, delete on table public.prospecting_events to authenticated;
grant select, insert, update, delete on table public.prospecting_communications to authenticated;
grant select, insert, update, delete on table public.prospects to authenticated;
grant select, insert, update, delete on table public.prospect_interactions to authenticated;
grant select, insert, update, delete on table public.prospect_ideas to authenticated;

create policy "Users manage their own clients"
  on public.clients for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own prospecting events"
  on public.prospecting_events for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own prospecting communications"
  on public.prospecting_communications for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own prospects"
  on public.prospects for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own prospect interactions"
  on public.prospect_interactions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own prospect ideas"
  on public.prospect_ideas for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.convert_prospect_to_client(target_prospect_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  prospect_row public.prospects%rowtype;
  new_client_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to convert a prospect'
      using errcode = '42501';
  end if;

  select * into prospect_row
  from public.prospects
  where id = target_prospect_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Prospect not found' using errcode = 'P0002';
  end if;

  if prospect_row.converted_client_id is not null then
    return prospect_row.converted_client_id;
  end if;

  insert into public.clients (
    user_id, kind, first_name, last_name, company_name, email, phone,
    postal_code, city, source_kind, source_detail, notes
  ) values (
    prospect_row.user_id, prospect_row.kind, prospect_row.first_name,
    prospect_row.last_name, prospect_row.company_name, prospect_row.email,
    prospect_row.phone, prospect_row.postal_code, prospect_row.city,
    prospect_row.source_kind, prospect_row.source_detail, prospect_row.notes
  ) returning id into new_client_id;

  update public.prospects
  set status = 'CONVERTED', converted_client_id = new_client_id
  where id = prospect_row.id and user_id = auth.uid();

  return new_client_id;
end;
$$;

create function public.convert_prospect_idea_to_client(target_idea_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  idea_row public.prospect_ideas%rowtype;
  new_client_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to convert a prospect idea'
      using errcode = '42501';
  end if;

  select * into idea_row
  from public.prospect_ideas
  where id = target_idea_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Prospect idea not found' using errcode = 'P0002';
  end if;

  if idea_row.converted_client_id is not null then
    return idea_row.converted_client_id;
  end if;

  insert into public.clients (
    user_id, kind, company_name, city, email, phone, notes, source_kind, source_detail
  ) values (
    idea_row.user_id, 'COMPANY', idea_row.name, idea_row.city, idea_row.email,
    idea_row.phone, idea_row.note, 'OTHER', 'Idée prospect'
  ) returning id into new_client_id;

  update public.prospect_ideas
  set converted_client_id = new_client_id
  where id = idea_row.id and user_id = auth.uid();

  return new_client_id;
end;
$$;

revoke all on function public.convert_prospect_to_client(uuid) from public, anon, authenticated;
revoke all on function public.convert_prospect_idea_to_client(uuid) from public, anon, authenticated;
grant execute on function public.convert_prospect_to_client(uuid) to authenticated;
grant execute on function public.convert_prospect_idea_to_client(uuid) to authenticated;
