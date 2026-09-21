create index cash_movements_personal_expense_user_index
  on public.cash_movements (personal_expense_id, user_id);
