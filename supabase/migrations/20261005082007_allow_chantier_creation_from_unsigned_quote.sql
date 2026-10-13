-- A chantier may now be created from an unsigned quote, without changing its status.
create or replace function public.create_chantier_from_quote(target_quote_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  quote_row public.quotes%rowtype;
  new_chantier_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to create a chantier' using errcode = '42501';
  end if;

  select * into quote_row
  from public.quotes
  where id = target_quote_id and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;

  if quote_row.client_id is null then
    raise exception 'A client must be linked to the quote before creating a chantier' using errcode = '22023';
  end if;
  if quote_row.chantier_id is not null then
    return quote_row.chantier_id;
  end if;

  insert into public.chantiers (
    user_id, client_id, name, address, initial_signed_quote_amount, initial_quote_id
  ) values (
    quote_row.user_id, quote_row.client_id,
    coalesce(nullif(btrim(quote_row.title), ''), 'Devis ' || quote_row.quote_number),
    quote_row.project_address, quote_row.total_ht, quote_row.id
  ) returning id into new_chantier_id;

  update public.quotes set chantier_id = new_chantier_id
  where id = quote_row.id and user_id = (select auth.uid());

  return new_chantier_id;
end;
$$;

-- Create the link, operational details and assignments in one transaction.
-- A retry returns the existing chantier without overwriting its details.
create function public.create_chantier_from_quote_with_details(
  target_quote_id uuid,
  target_client_id uuid,
  chantier_name text,
  chantier_address text,
  chantier_status text,
  chantier_start_date date,
  chantier_end_date date,
  chantier_notes text,
  selected_subcontractor_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  quote_row public.quotes%rowtype;
  selected_client public.clients%rowtype;
  new_chantier_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to create a chantier' using errcode = '42501';
  end if;
  select * into quote_row from public.quotes
  where id = target_quote_id and user_id = (select auth.uid())
  for update;
  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;
  if quote_row.chantier_id is not null then
    return quote_row.chantier_id;
  end if;

  if quote_row.client_id is null then
    select * into selected_client from public.clients
    where id = target_client_id and user_id = (select auth.uid()) and not is_archived;
    if not found then
      raise exception 'Select an available client' using errcode = '22023';
    end if;
    update public.quotes
    set client_id = selected_client.id,
        client_name = case when selected_client.kind = 'COMPANY'
          then selected_client.company_name
          else btrim(selected_client.first_name || ' ' || selected_client.last_name) end
    where id = quote_row.id and user_id = (select auth.uid());
  elsif quote_row.client_id is distinct from target_client_id then
    raise exception 'The chantier must use the client linked to the quote' using errcode = '22023';
  end if;

  new_chantier_id := public.create_chantier_from_quote(target_quote_id);
  update public.chantiers
  set name = btrim(chantier_name), address = btrim(chantier_address),
      status = chantier_status, planned_start_date = chantier_start_date,
      planned_end_date = chantier_end_date, notes = btrim(chantier_notes)
  where id = new_chantier_id and user_id = (select auth.uid());
  perform public.replace_chantier_subcontractors(new_chantier_id, selected_subcontractor_ids);

  return new_chantier_id;
end;
$$;

revoke all on function public.create_chantier_from_quote(uuid) from public, anon, authenticated;
grant execute on function public.create_chantier_from_quote(uuid) to authenticated;
revoke all on function public.create_chantier_from_quote_with_details(uuid, uuid, text, text, text, date, date, text, uuid[]) from public, anon, authenticated;
grant execute on function public.create_chantier_from_quote_with_details(uuid, uuid, text, text, text, date, date, text, uuid[]) to authenticated;
