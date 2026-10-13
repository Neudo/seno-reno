-- Keep existing numeric quantities and accept the unit labels used by Figma Make.
alter table public.chantier_procurements
  add column quantity_label text not null default ''
  check (char_length(quantity_label) <= 120);
