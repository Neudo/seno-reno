-- Execute in a transaction after importing a trusted backup into the three
-- pg_temp.routine_recovery_* tables. Never overwrite existing/customized rows.
insert into public.routine_categories (id, user_id, template_key, name, color, position, created_at, updated_at)
select saved.id, saved.user_id, saved.template_key, saved.name, saved.color, saved.position, saved.created_at, saved.updated_at
from pg_temp.routine_recovery_categories as saved
join auth.users as owner on owner.id = saved.user_id
where exists (
  select 1 from pg_temp.routine_recovery_items as item
  where item.category_id = saved.id and item.user_id = saved.user_id
    and item.is_permanent and (item.source_key is null or item.source_key not like '%:auto:%')
)
on conflict do nothing;

insert into public.routine_items (id, category_id, user_id, source_key, title, position, is_permanent, source_tag, is_urgent, created_at, updated_at)
select saved.id, category.id, saved.user_id, saved.source_key, saved.title, saved.position,
       saved.is_permanent, saved.source_tag, saved.is_urgent, saved.created_at, saved.updated_at
from pg_temp.routine_recovery_items as saved
join pg_temp.routine_recovery_categories as original_category
  on original_category.id = saved.category_id and original_category.user_id = saved.user_id
join lateral (
  select existing.id from public.routine_categories as existing
  where existing.user_id = saved.user_id
    and (existing.id = saved.category_id or (original_category.template_key is not null and existing.template_key = original_category.template_key))
  order by (existing.id = saved.category_id) desc
  limit 1
) as category on true
where saved.is_permanent and (saved.source_key is null or saved.source_key not like '%:auto:%')
on conflict do nothing;

insert into public.routine_item_completions (id, routine_item_id, user_id, routine_date, completed_at, created_at)
select completion.id, item.id, completion.user_id, completion.routine_date, completion.completed_at, completion.created_at
from pg_temp.routine_recovery_completions as completion
join pg_temp.routine_recovery_items as saved on saved.id = completion.routine_item_id and saved.user_id = completion.user_id
join lateral (
  select existing.id from public.routine_items as existing
  where existing.user_id = saved.user_id and (existing.id = saved.id or existing.source_key = saved.source_key)
  order by (existing.id = saved.id) desc
  limit 1
) as item on true
where saved.is_permanent and (saved.source_key is null or saved.source_key not like '%:auto:%')
on conflict do nothing;
