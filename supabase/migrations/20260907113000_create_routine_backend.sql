create extension if not exists pgcrypto;

create table public.routine_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  template_key text,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index routine_categories_user_template_key_unique
  on public.routine_categories (user_id, template_key)
  where template_key is not null;

create index routine_categories_user_position_index
  on public.routine_categories (user_id, position);

create table public.routine_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null,
  user_id uuid not null,
  source_key text,
  title text not null check (char_length(btrim(title)) between 1 and 240),
  position integer not null default 0 check (position >= 0),
  is_permanent boolean not null default true,
  source_tag text,
  is_urgent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, user_id)
    references public.routine_categories (id, user_id)
    on delete cascade,
  unique (id, user_id)
);

create unique index routine_items_user_source_key_unique
  on public.routine_items (user_id, source_key)
  where source_key is not null;

create index routine_items_category_position_index
  on public.routine_items (category_id, position);

create table public.routine_item_completions (
  id uuid primary key default gen_random_uuid(),
  routine_item_id uuid not null,
  user_id uuid not null,
  routine_date date not null default ((now() at time zone 'Europe/Paris')::date),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, routine_item_id, routine_date),
  foreign key (routine_item_id, user_id)
    references public.routine_items (id, user_id)
    on delete cascade
);

create index routine_item_completions_user_date_index
  on public.routine_item_completions (user_id, routine_date);

alter table public.routine_categories enable row level security;
alter table public.routine_items enable row level security;
alter table public.routine_item_completions enable row level security;

grant select, insert, update, delete on public.routine_categories to authenticated;
grant select, insert, update, delete on public.routine_items to authenticated;
grant select, insert, delete on public.routine_item_completions to authenticated;

create policy "Users manage their own routine categories"
  on public.routine_categories
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own routine items"
  on public.routine_items
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own routine completions"
  on public.routine_item_completions
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.bootstrap_routine()
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required to bootstrap a routine'
      using errcode = '42501';
  end if;

  insert into public.routine_categories (
    user_id,
    template_key,
    name,
    color,
    position
  )
  values
    (current_user_id, 'agenda', 'AGENDA', '#00365A', 0),
    (current_user_id, 'messagerie', 'MESSAGERIE', '#1D4ED8', 1),
    (current_user_id, 'finances', 'FINANCES', '#166534', 2),
    (current_user_id, 'chantiers_cours', 'CHANTIERS EN COURS', '#6B21A8', 3),
    (current_user_id, 'chantiers_signes', 'CHANTIERS SIGNÉS – NON COMMENCÉS', '#B45309', 4),
    (current_user_id, 'devis', 'DEVIS EN COURS', '#0369A1', 5),
    (current_user_id, 'suivi_general', 'TABLEAU SUIVI GÉNÉRAL SENO', '#7C3AED', 6),
    (current_user_id, 'prospection', 'PROSPECTION', '#BE185D', 7),
    (current_user_id, 'communication', 'COMMUNICATION', '#B91C1C', 8)
  on conflict (user_id, template_key) where template_key is not null do nothing;

  with seeded_items (
    category_key,
    source_key,
    title,
    position,
    is_permanent,
    source_tag,
    is_urgent
  ) as (
    values
      ('agenda', 'agenda:1', 'Rendez-vous du jour', 0, true, null, false),
      ('agenda', 'agenda:2', 'Contraintes horaires pro / perso', 1, true, null, false),
      ('messagerie', 'messagerie:1', 'Emails', 0, true, null, false),
      ('messagerie', 'messagerie:2', 'Répondeur téléphonique', 1, true, null, false),
      ('messagerie', 'messagerie:3', 'Messenger', 2, true, null, false),
      ('messagerie', 'messagerie:4', 'WIX (formulaires site)', 3, true, null, false),
      ('messagerie', 'messagerie:5', 'Instagram (messages directs)', 4, true, null, false),
      ('finances', 'finances:1', 'Position des comptes', 0, true, null, false),
      ('finances', 'finances:2', 'Facture acompte / solde ?', 1, true, null, false),
      ('finances', 'finances:3', 'Paiement sous-traitant ?', 2, true, null, false),
      ('finances', 'finances:4', 'Justificatifs → Charlotte', 3, true, null, false),
      ('finances', 'finances:auto:1', 'Facture acompte 30% à envoyer — Extension Bernard, Auxerre — 18 600 €', 4, false, 'Facture', true),
      ('finances', 'finances:auto:2', 'Paiement sous-traitant — Plomberie Fontaine — 4 000 € — échéance aujourd''hui — Chantier Renard', 5, false, 'Paiement ST', true),
      ('finances', 'finances:auto:3', 'Acompte intermédiaire à recevoir — Extension Moreau, Toucy — 20 400 €', 6, false, 'Encaissement', false),
      ('chantiers_cours', 'chantiers_cours:1', 'MAJ tableau Clients / Sous-traitants', 0, true, null, false),
      ('chantiers_cours', 'chantiers_cours:2', 'Vérifier marge / coûts', 1, true, null, false),
      ('chantiers_cours', 'chantiers_cours:3', 'Docs client / Sous-traitant', 2, true, null, false),
      ('chantiers_cours', 'chantiers_cours:4', 'Suivi commandes', 3, true, null, false),
      ('chantiers_cours', 'chantiers_cours:auto:1', 'Vérifier livraison parquet chêne — BL PB-2026-1142 — Appart T3 quai Marine, Auxerre', 4, false, 'Suivi commande', false),
      ('chantiers_cours', 'chantiers_cours:auto:2', 'Commande menuiseries extérieures en attente — Longère Aubert, Saint-Fargeau', 5, false, 'Suivi commande', true),
      ('chantiers_cours', 'chantiers_cours:auto:3', 'Mettre à jour tableau de suivi — Rénovation Chabrier, Joigny (avancement 71%)', 6, false, 'MAJ tableau', false),
      ('chantiers_signes', 'chantiers_signes:1', 'Faire / envoyer bon de commande sous-traitant', 0, true, null, false),
      ('chantiers_signes', 'chantiers_signes:2', 'Construire tableau de suivi', 1, true, null, false),
      ('chantiers_signes', 'chantiers_signes:3', 'Construire tableau de commandes', 2, true, null, false),
      ('chantiers_signes', 'chantiers_signes:auto:1', 'Envoyer bon de commande Béton Yonne — Dalle extension Bernard, Auxerre — 8 000 €', 3, false, 'Bon de commande', true),
      ('chantiers_signes', 'chantiers_signes:auto:2', 'Construire tableau de suivi — Maison Renard, Auxerre — démarrage 7 sept.', 4, false, 'Tableau suivi', false),
      ('devis', 'devis:1', 'Avancer / envoyer devis en cours', 0, true, null, false),
      ('devis', 'devis:auto:1', 'Relancer DEV-2026-0074 — Philippe Garnier, Migennes — électricité — 6 800 € — 19 jours sans réponse', 1, false, 'Relance devis', true),
      ('devis', 'devis:auto:2', 'Envoyer DEV-2026-0069 — Guy Lefebvre, Moutiers — plomberie — 7 400 € — finalisé le 25/08', 2, false, 'Devis à envoyer', true),
      ('devis', 'devis:auto:3', 'Mettre à jour devis — Faure, Sens — cuisine — choix matériaux en cours', 3, false, 'Devis à avancer', false),
      ('suivi_general', 'suivi_general:1', 'Devis à commencer', 0, true, null, false),
      ('suivi_general', 'suivi_general:2', 'Devis à relancer', 1, true, null, false),
      ('suivi_general', 'suivi_general:auto:1', 'Relancer devis — DEV-2026-0065 — Corinne Thibaut, Chablis — SDB — 14 000 € — 5 jours sans réponse', 2, false, 'À relancer', true),
      ('suivi_general', 'suivi_general:auto:2', 'Prospect à rappeler — Corinne Thibaut — rendez-vous à fixer début septembre', 3, false, 'Prospection', false),
      ('prospection', 'prospection:1', 'Architectes', 0, true, null, false),
      ('prospection', 'prospection:2', 'Notaires', 1, true, null, false),
      ('prospection', 'prospection:3', 'Agents immobiliers', 2, true, null, false),
      ('prospection', 'prospection:4', 'Autres contacts', 3, true, null, false),
      ('communication', 'communication:1', 'Instagram', 0, true, null, false),
      ('communication', 'communication:2', 'Facebook', 1, true, null, false),
      ('communication', 'communication:3', 'Site SENO', 2, true, null, false)
  )
  insert into public.routine_items (
    category_id,
    user_id,
    source_key,
    title,
    position,
    is_permanent,
    source_tag,
    is_urgent
  )
  select
    category.id,
    current_user_id,
    seeded_item.source_key,
    seeded_item.title,
    seeded_item.position,
    seeded_item.is_permanent,
    seeded_item.source_tag,
    seeded_item.is_urgent
  from seeded_items as seeded_item
  join public.routine_categories as category
    on category.user_id = current_user_id
    and category.template_key = seeded_item.category_key
  on conflict (user_id, source_key) where source_key is not null do nothing;
end;
$$;

revoke all on function public.bootstrap_routine() from public;
grant execute on function public.bootstrap_routine() to authenticated;
