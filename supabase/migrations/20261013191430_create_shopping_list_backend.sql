-- A chantier purchase stays the source of truth; the shopping list never copies it.
alter table public.chantier_procurements
  add column purchased_at timestamptz;

create index chantier_procurements_shopping_list_index
  on public.chantier_procurements (user_id, created_at desc)
  where kind = 'PURCHASE' and add_to_shopping_list;

-- Standalone articles shown under Divers in the supplied Figma Make design.
create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 240),
  quantity text not null default '' check (char_length(quantity) <= 120),
  supplier text not null default '' check (char_length(supplier) <= 240),
  estimated_amount numeric(12, 2) check (estimated_amount is null or estimated_amount >= 0),
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shopping_list_items_user_created_index
  on public.shopping_list_items (user_id, created_at desc);

create trigger set_shopping_list_items_updated_at
  before update on public.shopping_list_items
  for each row execute function public.set_chantier_procurements_updated_at();

alter table public.shopping_list_items enable row level security;
revoke all on table public.shopping_list_items from anon, authenticated;
grant select, insert, update, delete on table public.shopping_list_items to authenticated;

create policy "Users manage their own shopping list items"
  on public.shopping_list_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
