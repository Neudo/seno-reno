create extension if not exists pgcrypto;

create table public.price_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index price_categories_user_name_unique
  on public.price_categories (user_id, lower(name));

create index price_categories_user_position_index
  on public.price_categories (user_id, position);

create table public.price_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null,
  code text not null check (char_length(btrim(code)) between 1 and 50),
  designation text not null check (char_length(btrim(designation)) between 1 and 240),
  type text not null check (type in ('FIXED', 'PERCENTAGE', 'TO_ESTIMATE', 'COMMENT')),
  unit text not null default '' check (char_length(unit) <= 30),
  price numeric(12, 2) check (price is null or price >= 0),
  comment text not null default '' check (char_length(comment) <= 2000),
  requires_adjustment boolean not null default false,
  include_in_quote boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, user_id)
    references public.price_categories (id, user_id)
    on delete restrict,
  unique (user_id, code),
  unique (id, user_id)
);

create index price_items_user_category_index
  on public.price_items (user_id, category_id);

create index price_items_category_user_index
  on public.price_items (category_id, user_id);

create index price_items_user_active_updated_index
  on public.price_items (user_id, is_active, updated_at desc);

create table public.price_item_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  price_item_id uuid not null,
  previous_price numeric(12, 2),
  next_price numeric(12, 2),
  changed_at timestamptz not null default now(),
  foreign key (price_item_id, user_id)
    references public.price_items (id, user_id)
    on delete cascade
);

create index price_item_history_item_user_changed_index
  on public.price_item_history (price_item_id, user_id, changed_at desc);

create index price_item_history_user_index
  on public.price_item_history (user_id);

alter table public.price_categories enable row level security;
alter table public.price_items enable row level security;
alter table public.price_item_history enable row level security;

revoke all on table public.price_categories from anon, authenticated;
revoke all on table public.price_items from anon, authenticated;
revoke all on table public.price_item_history from anon, authenticated;

grant select, insert, update, delete on table public.price_categories to authenticated;
grant select, insert, update, delete on table public.price_items to authenticated;
grant select on table public.price_item_history to authenticated;

create policy "Users select their own price categories"
  on public.price_categories for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users insert their own price categories"
  on public.price_categories for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own price categories"
  on public.price_categories for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own price categories"
  on public.price_categories for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users select their own price items"
  on public.price_items for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users insert their own price items"
  on public.price_items for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own price items"
  on public.price_items for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own price items"
  on public.price_items for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users select their own price history"
  on public.price_item_history for select
  to authenticated
  using ((select auth.uid()) = user_id);

create function public.set_price_item_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_price_category_updated_at
before update on public.price_categories
for each row execute function public.set_price_item_updated_at();

create trigger set_price_item_updated_at
before update on public.price_items
for each row execute function public.set_price_item_updated_at();

create function public.record_price_item_history()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.price_item_history (user_id, price_item_id, previous_price, next_price)
    values (new.user_id, new.id, null, new.price);
  elsif old.price is distinct from new.price then
    insert into public.price_item_history (user_id, price_item_id, previous_price, next_price)
    values (new.user_id, new.id, old.price, new.price);
  end if;

  return new;
end;
$$;

revoke all on function public.record_price_item_history() from public;
revoke execute on function public.record_price_item_history() from anon, authenticated;

create trigger record_price_item_history
after insert or update on public.price_items
for each row execute function public.record_price_item_history();

create function public.apply_price_increase(
  increase_percentage numeric,
  target_category_id uuid default null
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  affected_rows integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to update prices'
      using errcode = '42501';
  end if;

  if increase_percentage <= -100 or increase_percentage > 1000 then
    raise exception 'Increase percentage must be greater than -100 and at most 1000'
      using errcode = '22023';
  end if;

  update public.price_items
  set price = round(price * (1 + increase_percentage / 100), 2)
  where user_id = auth.uid()
    and type = 'FIXED'
    and is_active
    and price is not null
    and (target_category_id is null or category_id = target_category_id);

  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

revoke all on function public.apply_price_increase(numeric, uuid) from public;
grant execute on function public.apply_price_increase(numeric, uuid) to authenticated;
