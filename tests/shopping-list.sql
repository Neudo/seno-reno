-- LOCAL Supabase only. Every fixture and mutation is rolled back.
begin;
do $$
declare
  owner_id uuid := gen_random_uuid();
  other_id uuid := gen_random_uuid();
  client_id uuid := gen_random_uuid();
  chantier_id uuid := gen_random_uuid();
begin
  insert into auth.users (id) values (owner_id), (other_id);
  insert into public.clients (id, user_id, last_name) values (client_id, owner_id, 'QA shopping client');
  insert into public.chantiers (id, user_id, client_id, name) values (chantier_id, owner_id, client_id, 'QA shopping chantier');
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform set_config('test.owner', owner_id::text, true);
  perform set_config('test.other', other_id::text, true);
  perform set_config('test.chantier', chantier_id::text, true);
end;
$$;
set local role authenticated;
do $$
declare
  owner_id uuid := auth.uid();
  chantier_id uuid := current_setting('test.chantier')::uuid;
  purchase_id uuid := gen_random_uuid();
  manual_id uuid := gen_random_uuid();
  affected integer;
begin
  insert into public.chantier_procurements (id,user_id,chantier_id,kind,title,quantity_label,forecast_amount,add_to_shopping_list,payment_status)
  values (purchase_id,owner_id,chantier_id,'PURCHASE','QA linked article','3 sacs',100,true,'UNPAID');
  insert into public.chantier_procurements (user_id,chantier_id,kind,title,forecast_amount,add_to_shopping_list)
  values (owner_id,chantier_id,'PURCHASE','QA excluded article',50,false),
    (owner_id,chantier_id,'ORDER','QA excluded order',200,true);
  insert into public.shopping_list_items (id,user_id,title,quantity,estimated_amount)
  values (manual_id,owner_id,'QA standalone article','2 boîtes',0);
  perform set_config('test.purchase', purchase_id::text, true);
  perform set_config('test.manual', manual_id::text, true);

  if (select count(*) from public.chantier_procurements p join public.chantiers c on c.id=p.chantier_id and c.user_id=p.user_id where p.kind='PURCHASE' and p.add_to_shopping_list) <> 1 then
    raise exception 'Only opted-in purchases should appear in the linked shopping list';
  end if;
  if (select count(*) from public.shopping_list_items) <> 1 then raise exception 'No copied chantier rows should be created'; end if;
  update public.chantier_procurements set purchased_at=now() where id=purchase_id;
  if not exists (select 1 from public.chantier_procurements where id=purchase_id and purchased_at is not null and payment_status='UNPAID' and forecast_amount=100 and quantity_label='3 sacs') then
    raise exception 'Bought status must preserve the original purchase, payment, quantity and amount';
  end if;
  update public.chantier_procurements set purchased_at=null where id=purchase_id;
  update public.chantier_procurements set add_to_shopping_list=false where id=purchase_id;
  if not exists (select 1 from public.chantier_procurements where id=purchase_id and not add_to_shopping_list and forecast_amount=100) then
    raise exception 'Removing a shopping entry must not delete its chantier purchase';
  end if;
  update public.shopping_list_items set purchased_at=now() where id=manual_id;
  if not exists (select 1 from public.shopping_list_items where id=manual_id and purchased_at is not null and estimated_amount=0) then raise exception 'Standalone checkbox must persist, including zero amounts'; end if;

  begin
    update public.shopping_list_items set user_id=current_setting('test.other')::uuid where id=manual_id;
    raise exception 'Reassigning an article to another owner should be denied';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.shopping_list_items (user_id,title,estimated_amount) values (owner_id,'QA invalid amount',-1);
    raise exception 'Negative estimated amounts must fail';
  exception when check_violation then null;
  end;
  begin
    insert into public.shopping_list_items (user_id,title) values (owner_id,'   ');
    raise exception 'Empty titles must fail';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', current_setting('test.other'), true);
  if exists (select 1 from public.shopping_list_items) or exists (select 1 from public.chantier_procurements) then raise exception 'Another owner must not see any fixture'; end if;
  update public.chantier_procurements set purchased_at=now() where id=purchase_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Another owner must not update a linked article'; end if;
  delete from public.shopping_list_items where id=manual_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Another owner must not delete a standalone article'; end if;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  delete from public.shopping_list_items where id=manual_id;
  if exists (select 1 from public.shopping_list_items where id=manual_id) then raise exception 'Standalone delete must persist'; end if;
  if has_table_privilege('anon','public.shopping_list_items','SELECT') or has_table_privilege('anon','public.shopping_list_items','INSERT') then raise exception 'Anonymous access must be denied'; end if;
  raise notice 'Shopping-list opt-in, persistence, non-destructive removal, validation and owner isolation verified';
end;
$$;
rollback;
