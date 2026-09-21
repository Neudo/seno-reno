revoke all on function public.reimburse_personal_expense(uuid, date) from anon;
revoke all on function public.reimburse_personal_expense(uuid, date) from public;
grant execute on function public.reimburse_personal_expense(uuid, date) to authenticated;
