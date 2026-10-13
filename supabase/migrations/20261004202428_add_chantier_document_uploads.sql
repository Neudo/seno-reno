alter table public.chantier_documents
  add column file_name text check (file_name is null or char_length(btrim(file_name)) between 1 and 240),
  add column file_path text unique check (file_path is null or char_length(btrim(file_path)) between 1 and 1024),
  add column mime_type text check (mime_type is null or char_length(btrim(mime_type)) between 1 and 180),
  add column file_size bigint check (file_size is null or file_size between 0 and 20971520);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chantier-documents',
  'chantier-documents',
  false,
  20971520,
  null
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users manage their own chantier documents"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'chantier-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'chantier-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
