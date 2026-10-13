create index routine_items_category_user_index
  on public.routine_items (category_id, user_id);

create index routine_item_completions_item_user_index
  on public.routine_item_completions (routine_item_id, user_id);

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
