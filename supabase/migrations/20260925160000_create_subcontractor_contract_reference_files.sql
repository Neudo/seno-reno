create table public.subcontractor_contract_reference_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slot text not null check (slot in ('REFERENCE_1', 'REFERENCE_2')),
  file_name text not null check (char_length(btrim(file_name)) between 1 and 240),
  file_path text not null unique check (char_length(btrim(file_path)) between 1 and 1024),
  mime_type text not null check (char_length(btrim(mime_type)) between 1 and 180),
  file_size bigint not null check (file_size between 0 and 20971520),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slot)
);

create function public.set_subcontractor_contract_reference_files_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_subcontractor_contract_reference_files_updated_at
before update on public.subcontractor_contract_reference_files
for each row execute function public.set_subcontractor_contract_reference_files_updated_at();

alter table public.subcontractor_contract_reference_files enable row level security;

revoke all on table public.subcontractor_contract_reference_files from anon, authenticated;
grant select, insert, update, delete on table public.subcontractor_contract_reference_files to authenticated;

create policy "Users manage their own subcontractor contract reference files"
  on public.subcontractor_contract_reference_files for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and file_path like ((select auth.uid())::text || '/%')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'subcontractor-contract-reference-files',
  'subcontractor-contract-reference-files',
  false,
  20971520,
  null
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users manage their own subcontractor contract reference documents"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'subcontractor-contract-reference-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'subcontractor-contract-reference-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

revoke all on function public.set_subcontractor_contract_reference_files_updated_at() from public, anon, authenticated;
