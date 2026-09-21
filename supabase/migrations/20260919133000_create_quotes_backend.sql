create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid,
  client_name text not null check (char_length(btrim(client_name)) between 1 and 180),
  quote_number text not null check (char_length(btrim(quote_number)) between 1 and 80),
  title text not null default '' check (char_length(title) <= 240),
  project_address text not null default '' check (char_length(project_address) <= 500),
  quote_date date,
  total_ht numeric(12, 2) check (total_ht is null or total_ht >= 0),
  total_ttc numeric(12, 2) check (total_ttc is null or total_ttc >= 0),
  document_name text not null check (char_length(btrim(document_name)) between 1 and 240),
  document_path text not null unique check (char_length(btrim(document_path)) between 1 and 1024),
  status text not null default 'TO_SEND' check (status in ('TO_SEND', 'SENT', 'TO_FOLLOW_UP', 'IN_DISCUSSION', 'SIGNED', 'REFUSED')),
  last_action_note text not null default '' check (char_length(last_action_note) <= 2000),
  last_action_at date,
  next_follow_up_at date,
  comment text not null default '' check (char_length(comment) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (client_id, user_id)
    references public.clients (id, user_id)
    on delete restrict,
  unique (id, user_id)
);

create unique index quotes_user_number_unique
  on public.quotes (user_id, lower(quote_number));

create index quotes_user_status_follow_up_index
  on public.quotes (user_id, status, next_follow_up_at);

create index quotes_client_user_index
  on public.quotes (client_id, user_id);

create function public.set_quotes_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_quotes_updated_at
before update on public.quotes
for each row execute function public.set_quotes_updated_at();

alter table public.quotes enable row level security;

revoke all on table public.quotes from anon, authenticated;
grant select, insert, update, delete on table public.quotes to authenticated;

create policy "Users manage their own quotes"
  on public.quotes for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quote-documents',
  'quote-documents',
  false,
  20971520,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users manage their own quote documents"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'quote-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'quote-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

revoke all on function public.set_quotes_updated_at() from public;
revoke execute on function public.set_quotes_updated_at() from anon, authenticated;
