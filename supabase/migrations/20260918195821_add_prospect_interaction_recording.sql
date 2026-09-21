create function public.record_prospect_interaction(
  target_prospect_id uuid,
  interaction_type text,
  interaction_note text,
  interaction_next_follow_up_at date default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  interaction_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to record a prospect interaction'
      using errcode = '42501';
  end if;

  if interaction_type not in ('CALL', 'EMAIL', 'MEETING', 'MESSAGE', 'NOTE', 'OTHER') then
    raise exception 'Invalid prospect interaction type'
      using errcode = '22023';
  end if;

  update public.prospects
  set
    last_interaction_at = now(),
    next_follow_up_at = interaction_next_follow_up_at
  where id = target_prospect_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Prospect not found'
      using errcode = 'P0002';
  end if;

  insert into public.prospect_interactions (
    user_id,
    prospect_id,
    type,
    note,
    next_follow_up_at
  )
  values (
    auth.uid(),
    target_prospect_id,
    interaction_type,
    coalesce(interaction_note, ''),
    interaction_next_follow_up_at
  )
  returning id into interaction_id;

  return interaction_id;
end;
$$;

revoke all on function public.record_prospect_interaction(uuid, text, text, date)
  from public, anon, authenticated;
grant execute on function public.record_prospect_interaction(uuid, text, text, date)
  to authenticated;
