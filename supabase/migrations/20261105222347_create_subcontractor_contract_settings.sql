create table public.subcontractor_contract_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  company_name text not null check (char_length(btrim(company_name)) between 1 and 120),
  legal_form text not null check (char_length(btrim(legal_form)) between 1 and 100),
  capital text not null default '' check (char_length(capital) <= 60),
  registered_address text not null check (char_length(btrim(registered_address)) between 1 and 320),
  registry_city text not null check (char_length(btrim(registry_city)) between 1 and 100),
  registration_number text not null check (char_length(btrim(registration_number)) between 1 and 50),
  representatives text not null check (char_length(btrim(representatives)) between 1 and 200),
  court_city text not null check (char_length(btrim(court_city)) between 1 and 100),
  default_signature_city text not null default '' check (char_length(default_signature_city) <= 100)
);

alter table public.subcontractor_contract_settings enable row level security;
revoke all on table public.subcontractor_contract_settings from public, anon, authenticated;
grant select, insert, update on table public.subcontractor_contract_settings to authenticated;

create policy "Users manage their own subcontractor contract settings"
  on public.subcontractor_contract_settings for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
