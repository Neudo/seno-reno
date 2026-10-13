revoke execute on function public.record_price_item_history() from anon, authenticated;

drop index if exists public.price_item_history_item_changed_index;
