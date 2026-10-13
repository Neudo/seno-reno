-- Run against LOCAL Supabase only: all fixtures and assertions are rolled back.
-- docker exec -i supabase_db_seno-reno psql -U postgres -d postgres -v ON_ERROR_STOP=1 < tests/chantier-quote-creation.sql
begin;

do $$
declare
  test_client public.clients%rowtype;
begin
  select * into test_client from public.clients where not is_archived limit 1;
  if not found then raise exception 'A local test client is required'; end if;
  perform set_config('request.jwt.claim.sub', test_client.user_id::text, true);
  perform set_config('test.client_id', test_client.id::text, true);
end;
$$;

set local role authenticated;

do $$
<<checks>>
declare
  test_client_id uuid := current_setting('test.client_id')::uuid;
  owner_id uuid := auth.uid();
  quote_id uuid;
  chantier_id uuid;
  retry_id uuid;
  quote_status text;
  owner_quote_id uuid;
begin
  foreach quote_status in array array['TO_SEND', 'SENT', 'TO_FOLLOW_UP', 'IN_DISCUSSION', 'SIGNED', 'REFUSED'] loop
    quote_id := gen_random_uuid();
    insert into public.quotes (id, user_id, client_id, client_name, quote_number, title, total_ht, document_name, document_path, status)
    values (quote_id, owner_id, test_client_id, 'Test client', 'TEST-' || quote_id, 'Test quote', 32000, 'test.pdf', owner_id || '/' || quote_id || '/test.pdf', quote_status);
    chantier_id := public.create_chantier_from_quote(quote_id);
    if not exists (select 1 from public.chantiers where id = chantier_id and initial_quote_id = quote_id and client_id = test_client_id and initial_signed_quote_amount = 32000 and actual_end_date is null) then
      raise exception 'Quote link, client or amount not preserved';
    end if;
    if not exists (select 1 from public.quotes q where q.id = quote_id and q.status = quote_status and q.chantier_id = checks.chantier_id) then
      raise exception 'Quote status or link not preserved';
    end if;
    retry_id := public.create_chantier_from_quote(quote_id);
    if retry_id <> chantier_id then raise exception 'Creation must be idempotent'; end if;
    owner_quote_id := quote_id;
  end loop;
  raise notice 'All six quote statuses accepted without changing their status';

  quote_id := gen_random_uuid();
  insert into public.quotes (id, user_id, client_name, quote_number, title, total_ht, document_name, document_path, status)
  values (quote_id, owner_id, 'Imported PDF client', 'TEST-' || quote_id, 'PDF title', 1200, 'test.pdf', owner_id || '/' || quote_id || '/test.pdf', 'SENT');
  begin
    perform public.create_chantier_from_quote_with_details(quote_id, test_client_id, 'Test chantier', 'Address', 'IN_PROGRESS', '2026-10-10', '2026-10-01', 'Notes', '{}');
    raise exception 'Invalid dates should fail';
  exception when check_violation then null;
  end;
  if exists (select 1 from public.chantiers where initial_quote_id = quote_id) or exists (select 1 from public.quotes q where q.id = quote_id and (q.chantier_id is not null or q.client_id is not null)) then
    raise exception 'Failed date validation must roll back creation and client attachment';
  end if;

  begin
    perform public.create_chantier_from_quote_with_details(quote_id, test_client_id, 'Test chantier', 'Address', 'IN_PROGRESS', '2026-10-01', '2026-10-10', 'Notes', array[gen_random_uuid()]);
    raise exception 'Unavailable subcontractor should fail';
  exception when invalid_parameter_value then null;
  end;
  if exists (select 1 from public.chantiers where initial_quote_id = quote_id) or exists (select 1 from public.quotes q where q.id = quote_id and (q.chantier_id is not null or q.client_id is not null)) then
    raise exception 'Failed subcontractor assignment must roll back creation and client attachment';
  end if;
  raise notice 'Invalid dates and assignments leave no orphan chantier';

  chantier_id := public.create_chantier_from_quote_with_details(quote_id, test_client_id, 'Test chantier', 'Address', 'IN_PROGRESS', '2026-10-01', '2026-10-10', 'Notes', '{}');
  if not exists (select 1 from public.chantiers c where c.id = chantier_id and c.name = 'Test chantier' and c.address = 'Address' and c.status = 'IN_PROGRESS' and c.planned_start_date = '2026-10-01' and c.planned_end_date = '2026-10-10' and c.notes = 'Notes' and c.initial_signed_quote_amount = 1200) then
    raise exception 'Operational details not saved';
  end if;
  if not exists (select 1 from public.quotes q where q.id = quote_id and q.client_id = test_client_id and q.status = 'SENT') then raise exception 'Client link/status not preserved'; end if;
  retry_id := public.create_chantier_from_quote_with_details(quote_id, test_client_id, 'Must not overwrite', '', 'PENDING', null, null, '', '{}');
  if retry_id <> chantier_id or not exists (select 1 from public.chantiers c where c.id = chantier_id and c.name = 'Test chantier') then raise exception 'Retry overwrote existing chantier'; end if;
  raise notice 'Operational details, client attachment and safe retries verified';

  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  begin
    perform public.create_chantier_from_quote(owner_quote_id);
    raise exception 'Another user must not access the quote';
  exception when no_data_found then null;
  end;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  if has_function_privilege('anon', 'public.create_chantier_from_quote(uuid)', 'EXECUTE') or has_function_privilege('anon', 'public.create_chantier_from_quote_with_details(uuid,uuid,text,text,text,date,date,text,uuid[])', 'EXECUTE') then
    raise exception 'Anonymous role must not execute creation functions';
  end if;
  raise notice 'Owner isolation and anonymous access denied';
end;
$$;

rollback;
