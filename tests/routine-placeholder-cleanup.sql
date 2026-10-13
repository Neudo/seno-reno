-- Run only in a scratch PostgreSQL database, never in the application database.
-- The test recreates the legacy seeds, applies the real migration and rolls back.
\set ON_ERROR_STOP on
begin;
do $$ begin
  if to_regclass('public.routine_categories') is not null or to_regclass('auth.users') is not null then
    raise exception 'This test requires a disposable, empty database';
  end if;
end; $$;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
grant usage on schema auth to authenticated;

\ir ../supabase/migrations/20260907113000_create_routine_backend.sql
\ir ../supabase/migrations/20260907121500_harden_routine_indexes.sql
\ir ../supabase/migrations/20260907123000_restrict_routine_bootstrap.sql

insert into auth.users values ('00000000-0000-4000-8000-000000000001'), ('00000000-0000-4000-8000-000000000002');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select public.bootstrap_routine();
do $$ begin
  if (select count(*) from public.routine_items) <> 41 then raise exception 'Unexpected legacy seed count'; end if;
end; $$;

-- An edited template task, user-created tasks, real business source and category customization.
update public.routine_items set title = 'Tâche personnalisée' where source_key = 'agenda:1';
update public.routine_items set position = 99 where source_key = 'agenda:2';
update public.routine_categories set name = 'Communication personnalisée' where template_key = 'communication';
insert into public.routine_items (category_id, user_id, title, is_permanent)
select id, user_id, 'Emails', true from public.routine_categories where template_key = 'messagerie';
insert into public.routine_items (category_id, user_id, title, source_key, is_permanent, source_tag)
select id, user_id, 'Échéance réellement enregistrée', 'invoice:real', false, 'Facture'
from public.routine_categories where template_key = 'finances';
insert into public.routine_categories (user_id, name, color)
values (auth.uid(), 'Catégorie personnelle', '#00365A');
insert into public.routine_items (category_id, user_id, title)
select id, user_id, 'Tâche saisie' from public.routine_categories where template_key is null;
insert into public.routine_item_completions (routine_item_id, user_id)
select id, user_id from public.routine_items where source_key in ('agenda:1', 'finances:auto:1') or title = 'Tâche saisie';

\ir ../supabase/migrations/20261013083133_remove_routine_placeholders.sql

do $$ begin
  if (select count(*) from public.routine_items) <> 4 then raise exception 'Real tasks were removed or placeholders remain'; end if;
  if (select count(*) from public.routine_categories) <> 5 then raise exception 'Customized/nonempty categories were removed'; end if;
  if (select count(*) from public.routine_item_completions) <> 2 then raise exception 'Real completion history not preserved'; end if;
  if not exists (select 1 from public.routine_items where title = 'Emails' and source_key is null) then raise exception 'A user task with a default title must survive'; end if;
  if exists (select 1 from public.routine_items where source_key = 'agenda:2') then raise exception 'Reordering must not turn a placeholder into real data'; end if;
  if has_function_privilege('anon', 'public.bootstrap_routine()', 'EXECUTE') then raise exception 'Bootstrap must not be accessible anonymously'; end if;
end; $$;

-- Idempotency, old-client calls and empty accounts must never reintroduce templates.
\ir ../supabase/migrations/20261013083133_remove_routine_placeholders.sql
set local role authenticated;
select public.bootstrap_routine();
do $$ begin
  if (select count(*) from public.routine_items) <> 4 then raise exception 'Old client recreated placeholders'; end if;
end; $$;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
select public.bootstrap_routine();
do $$ begin
  if exists (select 1 from public.routine_categories) or exists (select 1 from public.routine_items) then raise exception 'Empty accounts must remain empty'; end if;
end; $$;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  begin
    perform public.bootstrap_routine();
    raise exception 'Authentication must still be required';
  exception when insufficient_privilege then null;
  end;
end; $$;
rollback;
