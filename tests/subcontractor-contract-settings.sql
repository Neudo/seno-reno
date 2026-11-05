-- Local Supabase only. Fixtures and all writes are rolled back.
begin;

do $$
declare
  owner_id uuid := gen_random_uuid();
  other_id uuid := gen_random_uuid();
begin
  insert into auth.users (id) values (owner_id), (other_id);
  perform set_config('test.owner', owner_id::text, true);
  perform set_config('test.other', other_id::text, true);
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
end;
$$;

set local role authenticated;
do $$
declare
  owner_id uuid := auth.uid();
  other_id uuid := current_setting('test.other')::uuid;
  affected integer;
begin
  insert into public.subcontractor_contract_settings
    (user_id, company_name, legal_form, registered_address, registry_city,
     registration_number, representatives, court_city, default_signature_city)
  values (owner_id, 'Société test', 'SARL', 'Adresse test', 'Ville test',
          'RCS test', 'Représentant test', 'Juridiction test', 'Signature test');

  insert into public.subcontractor_contract_settings
    (user_id, company_name, legal_form, registered_address, registry_city,
     registration_number, representatives, court_city)
  values (owner_id, 'Société test modifiée', 'SARL', 'Adresse test', 'Ville test',
          'RCS test', 'Représentant test', 'Juridiction test')
  on conflict (user_id) do update set company_name = excluded.company_name;

  if (select count(*) from public.subcontractor_contract_settings) <> 1
    or not exists (
      select 1 from public.subcontractor_contract_settings
      where company_name = 'Société test modifiée'
        and default_signature_city = 'Signature test'
    )
  then
    raise exception 'An owner must be able to save and reload one settings row';
  end if;

  begin
    update public.subcontractor_contract_settings set user_id = other_id;
    raise exception 'Ownership transfer should be denied';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.subcontractor_contract_settings set company_name = ' ';
    raise exception 'A blank company name should be denied';
  exception when check_violation then null;
  end;

  perform set_config('request.jwt.claim.sub', other_id::text, true);
  if exists (select 1 from public.subcontractor_contract_settings) then
    raise exception 'A second account must not read the owner profile';
  end if;

  update public.subcontractor_contract_settings set company_name = 'Écrasement test'
  where user_id = owner_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'A second account must not update the owner profile'; end if;

  if has_table_privilege('anon', 'public.subcontractor_contract_settings', 'SELECT')
    or has_table_privilege('anon', 'public.subcontractor_contract_settings', 'INSERT')
    or has_table_privilege('authenticated', 'public.subcontractor_contract_settings', 'DELETE')
  then raise exception 'Unexpected access to the settings table'; end if;
end;
$$;
rollback;
