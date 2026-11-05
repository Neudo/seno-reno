-- Cover the chantier-first composite foreign keys used by joins and cascades.
-- The existing user-first indexes remain useful for owner-scoped lists.
create index chantier_procurements_chantier_user_index
  on public.chantier_procurements (chantier_id, user_id);

create index chantier_deposits_chantier_user_index
  on public.chantier_deposits (chantier_id, user_id);

create index chantier_adjustments_chantier_user_index
  on public.chantier_adjustments (chantier_id, user_id);

create index chantier_documents_chantier_user_index
  on public.chantier_documents (chantier_id, user_id);
