revoke execute on function public.record_price_item_history() from anon, authenticated;

create index price_items_category_user_index
  on public.price_items (category_id, user_id);

drop index public.price_item_history_item_changed_index;

create index price_item_history_item_user_changed_index
  on public.price_item_history (price_item_id, user_id, changed_at desc);

create index price_item_history_user_index
  on public.price_item_history (user_id);
