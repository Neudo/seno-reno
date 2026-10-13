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
  if (select count(*) from public.routine_items) <> 31 then raise exception 'Base/real tasks were removed or fake alerts remain'; end if;
  if (select count(*) from public.routine_categories) <> 10 then raise exception 'Base categories were removed'; end if;
  if (select count(*) from public.routine_item_completions) <> 2 then raise exception 'Real completion history not preserved'; end if;
  if not exists (select 1 from public.routine_items where title = 'Emails' and source_key is null) then raise exception 'A user task with a default title must survive'; end if;
  if not exists (select 1 from public.routine_items where source_key = 'agenda:2' and position = 99) then raise exception 'Reordered base tasks must survive'; end if;
  if exists (select 1 from public.routine_items where source_key like '%:auto:%') then raise exception 'Fake dynamic examples remain'; end if;
  if has_function_privilege('anon', 'public.bootstrap_routine()', 'EXECUTE') then raise exception 'Bootstrap must not be accessible anonymously'; end if;
end; $$;

-- Idempotency and deliberately deleted base tasks must be preserved.
\ir ../supabase/migrations/20261013083133_remove_routine_placeholders.sql
set local role authenticated;
select public.bootstrap_routine();
do $$ begin
  if (select count(*) from public.routine_items) <> 31 then raise exception 'Existing routine was changed'; end if;
end; $$;
delete from public.routine_items where source_key = 'messagerie:4';
select public.bootstrap_routine();
do $$ begin
  if exists (select 1 from public.routine_items where source_key = 'messagerie:4') then raise exception 'Deleted base task was recreated'; end if;
end; $$;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
select public.bootstrap_routine();
do $$ begin
  if (select count(*) from public.routine_categories) <> 9 or (select count(*) from public.routine_items) <> 28 then raise exception 'New accounts need the original base routine'; end if;
  if exists (select 1 from public.routine_items where not is_permanent or source_key like '%:auto:%') then raise exception 'New accounts must not receive fake alerts'; end if;
end; $$;

-- Simulate the erroneous prior local cleanup, then restore original IDs/coches.
reset role;
create temp table routine_recovery_categories as select * from public.routine_categories where user_id = auth.uid();
create temp table routine_recovery_items as select * from public.routine_items where user_id = auth.uid();
insert into public.routine_item_completions (routine_item_id, user_id)
select id, user_id from public.routine_items where user_id = auth.uid() and source_key = 'messagerie:1';
create temp table routine_recovery_completions as select * from public.routine_item_completions where user_id = auth.uid();
insert into routine_recovery_items (id, category_id, user_id, source_key, title, position, is_permanent, source_tag, is_urgent, created_at, updated_at)
select gen_random_uuid(), id, user_id, 'finances:auto:1', 'Fausse alerte de test', 99, false, 'Facture', true, now(), now()
from routine_recovery_categories where template_key = 'finances';
delete from public.routine_categories where user_id = auth.uid();
\ir ../supabase/migrations/20261013120016_restore_routine_base_tasks.sql
\ir ../scripts/sql/restore-routine-base-from-staging.sql
do $$ begin
  if (select count(*) from public.routine_items where user_id = auth.uid()) <> 28 then raise exception 'Base restoration failed'; end if;
  if (select count(*) from public.routine_items item join routine_recovery_items saved on item.id = saved.id where item.user_id = auth.uid()) <> 28 then raise exception 'Original task IDs were lost'; end if;
  if (select count(*) from public.routine_item_completions where user_id = auth.uid()) <> 1 then raise exception 'Completion history was lost'; end if;
  if exists (select 1 from public.routine_items where user_id = auth.uid() and source_key like '%:auto:%') then raise exception 'Recovery restored a fake alert'; end if;
end; $$;
update public.routine_items set title = 'Modification après restauration' where user_id = auth.uid() and source_key = 'agenda:1';
\ir ../scripts/sql/restore-routine-base-from-staging.sql
do $$ begin
  if not exists (select 1 from public.routine_items where user_id = auth.uid() and title = 'Modification après restauration') then raise exception 'Recovery overwrote current changes'; end if;
end; $$;
set local role authenticated;
select public.bootstrap_routine();
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  begin
    perform public.bootstrap_routine();
    raise exception 'Authentication must still be required';
  exception when insufficient_privilege then null;
  end;
end; $$;
rollback;
