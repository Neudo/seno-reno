import { supabase } from "@/features/auth/api/supabase-client";

export const cashMovementKinds = [
  "MANUAL_INCOME",
  "MANUAL_EXPENSE",
  "PERSONAL_REIMBURSEMENT",
] as const;

export const cashMovementStatuses = [
  "PLANNED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const fixedCostRecurrences = [
  "MONTHLY",
  "QUARTERLY",
  "SEMIANNUAL",
  "YEARLY",
] as const;

export const personalExpenseTypes = [
  "PERSONAL_ADVANCE",
  "EXPENSE_REPORT",
] as const;

export type CashMovementKind = (typeof cashMovementKinds)[number];
export type CashMovementStatus = (typeof cashMovementStatuses)[number];
export type FixedCostRecurrence = (typeof fixedCostRecurrences)[number];
export type PersonalExpenseType = (typeof personalExpenseTypes)[number];

export type CashMovement = {
  actualDate: string | null;
  amount: number;
  comment: string;
  createdAt: string;
  direction: "INCOME" | "EXPENSE";
  expectedDate: string;
  id: string;
  kind: CashMovementKind;
  label: string;
  personalExpenseId: string | null;
  status: CashMovementStatus;
  updatedAt: string;
};

export type FixedCost = {
  amount: number;
  category: string;
  comment: string;
  createdAt: string;
  dueDate: string | null;
  dueDay: number | null;
  endDate: string | null;
  id: string;
  isActive: boolean;
  name: string;
  recurrence: FixedCostRecurrence;
  reminderDaysBefore: number;
  startDate: string;
  updatedAt: string;
};

export type PersonalExpense = {
  amount: number;
  comment: string;
  createdAt: string;
  expenseDate: string;
  id: string;
  label: string;
  plannedReimbursementDate: string | null;
  reimbursedAt: string | null;
  scope: "COMPANY";
  supplier: string;
  type: PersonalExpenseType;
  updatedAt: string;
};

export type FinanceSnapshot = {
  cashMovements: CashMovement[];
  fixedCosts: FixedCost[];
  personalExpenses: PersonalExpense[];
};

type CashMovementRow = {
  actual_date: string | null;
  amount: number | string;
  comment: string;
  created_at: string;
  direction: CashMovement["direction"];
  expected_date: string;
  id: string;
  kind: CashMovementKind;
  label: string;
  personal_expense_id: string | null;
  status: CashMovementStatus;
  updated_at: string;
};

type FixedCostRow = {
  amount: number | string;
  category: string;
  comment: string;
  created_at: string;
  due_date: string | null;
  due_day: number | null;
  end_date: string | null;
  id: string;
  is_active: boolean;
  name: string;
  recurrence: FixedCostRecurrence;
  reminder_days_before: number;
  start_date: string;
  updated_at: string;
};

type PersonalExpenseRow = {
  amount: number | string;
  comment: string;
  created_at: string;
  expense_date: string;
  id: string;
  label: string;
  planned_reimbursement_date: string | null;
  reimbursed_at: string | null;
  scope: "COMPANY";
  supplier: string;
  type: PersonalExpenseType;
  updated_at: string;
};

function getClient() {
  if (!supabase) {
    throw new Error("Supabase n'est pas configuré.");
  }

  return supabase;
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

function toNumber(value: number | string) {
  return Number(value);
}

function toCashMovement(row: CashMovementRow): CashMovement {
  return {
    actualDate: row.actual_date,
    amount: toNumber(row.amount),
    comment: row.comment,
    createdAt: row.created_at,
    direction: row.direction,
    expectedDate: row.expected_date,
    id: row.id,
    kind: row.kind,
    label: row.label,
    personalExpenseId: row.personal_expense_id,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function toFixedCost(row: FixedCostRow): FixedCost {
  return {
    amount: toNumber(row.amount),
    category: row.category,
    comment: row.comment,
    createdAt: row.created_at,
    dueDate: row.due_date,
    dueDay: row.due_day,
    endDate: row.end_date,
    id: row.id,
    isActive: row.is_active,
    name: row.name,
    recurrence: row.recurrence,
    reminderDaysBefore: row.reminder_days_before,
    startDate: row.start_date,
    updatedAt: row.updated_at,
  };
}

function toPersonalExpense(row: PersonalExpenseRow): PersonalExpense {
  return {
    amount: toNumber(row.amount),
    comment: row.comment,
    createdAt: row.created_at,
    expenseDate: row.expense_date,
    id: row.id,
    label: row.label,
    plannedReimbursementDate: row.planned_reimbursement_date,
    reimbursedAt: row.reimbursed_at,
    scope: row.scope,
    supplier: row.supplier,
    type: row.type,
    updatedAt: row.updated_at,
  };
}

export async function getFinanceSnapshot(): Promise<FinanceSnapshot> {
  const client = getClient();
  const [cashMovementsResult, fixedCostsResult, personalExpensesResult] =
    await Promise.all([
      client
        .from("cash_movements")
        .select(
          "id, kind, direction, label, amount, expected_date, actual_date, status, comment, personal_expense_id, created_at, updated_at",
        )
        .order("expected_date", { ascending: true }),
      client
        .from("fixed_costs")
        .select(
          "id, name, category, amount, recurrence, due_day, due_date, start_date, end_date, comment, is_active, reminder_days_before, created_at, updated_at",
        )
        .order("is_active", { ascending: false })
        .order("name", { ascending: true }),
      client
        .from("personal_expenses")
        .select(
          "id, type, expense_date, label, supplier, amount, scope, planned_reimbursement_date, reimbursed_at, comment, created_at, updated_at",
        )
        .order("reimbursed_at", { ascending: true, nullsFirst: true })
        .order("planned_reimbursement_date", { ascending: true, nullsFirst: true })
        .order("expense_date", { ascending: false }),
    ]);

  throwIfError(cashMovementsResult.error);
  throwIfError(fixedCostsResult.error);
  throwIfError(personalExpensesResult.error);

  return {
    cashMovements: ((cashMovementsResult.data ?? []) as CashMovementRow[]).map(
      toCashMovement,
    ),
    fixedCosts: ((fixedCostsResult.data ?? []) as FixedCostRow[]).map(toFixedCost),
    personalExpenses: (
      (personalExpensesResult.data ?? []) as PersonalExpenseRow[]
    ).map(toPersonalExpense),
  };
}

export async function createManualCashMovement({
  actualDate,
  amount,
  comment,
  direction,
  expectedDate,
  label,
  status,
  userId,
}: {
  actualDate: string | null;
  amount: number;
  comment: string;
  direction: CashMovement["direction"];
  expectedDate: string;
  label: string;
  status: CashMovementStatus;
  userId: string;
}) {
  const result = await getClient().from("cash_movements").insert({
    actual_date: actualDate,
    amount,
    comment,
    direction,
    expected_date: expectedDate,
    kind: direction === "INCOME" ? "MANUAL_INCOME" : "MANUAL_EXPENSE",
    label,
    status,
    user_id: userId,
  });

  throwIfError(result.error);
}

export async function updateManualCashMovement({
  actualDate,
  amount,
  comment,
  direction,
  expectedDate,
  id,
  label,
  status,
}: {
  actualDate: string | null;
  amount: number;
  comment: string;
  direction: CashMovement["direction"];
  expectedDate: string;
  id: string;
  label: string;
  status: CashMovementStatus;
}) {
  const result = await getClient()
    .from("cash_movements")
    .update({
      actual_date: actualDate,
      amount,
      comment,
      direction,
      expected_date: expectedDate,
      kind: direction === "INCOME" ? "MANUAL_INCOME" : "MANUAL_EXPENSE",
      label,
      status,
    })
    .eq("id", id)
    .in("kind", ["MANUAL_INCOME", "MANUAL_EXPENSE"]);

  throwIfError(result.error);
}

export async function deleteManualCashMovement(id: string) {
  const result = await getClient()
    .from("cash_movements")
    .delete()
    .eq("id", id)
    .in("kind", ["MANUAL_INCOME", "MANUAL_EXPENSE"]);

  throwIfError(result.error);
}

export async function createFixedCost({
  amount,
  category,
  comment,
  dueDate,
  dueDay,
  endDate,
  isActive,
  name,
  recurrence,
  reminderDaysBefore,
  startDate,
  userId,
}: Omit<FixedCost, "createdAt" | "id" | "updatedAt"> & { userId: string }) {
  const result = await getClient().from("fixed_costs").insert({
    amount,
    category,
    comment,
    due_date: dueDate,
    due_day: dueDay,
    end_date: endDate,
    is_active: isActive,
    name,
    recurrence,
    reminder_days_before: reminderDaysBefore,
    start_date: startDate,
    user_id: userId,
  });

  throwIfError(result.error);
}

export async function updateFixedCost({
  amount,
  category,
  comment,
  dueDate,
  dueDay,
  endDate,
  id,
  isActive,
  name,
  recurrence,
  reminderDaysBefore,
  startDate,
}: Omit<FixedCost, "createdAt" | "updatedAt">) {
  const result = await getClient()
    .from("fixed_costs")
    .update({
      amount,
      category,
      comment,
      due_date: dueDate,
      due_day: dueDay,
      end_date: endDate,
      is_active: isActive,
      name,
      recurrence,
      reminder_days_before: reminderDaysBefore,
      start_date: startDate,
    })
    .eq("id", id);

  throwIfError(result.error);
}

export async function deleteFixedCost(id: string) {
  const result = await getClient().from("fixed_costs").delete().eq("id", id);
  throwIfError(result.error);
}

export async function createPersonalExpense({
  amount,
  comment,
  expenseDate,
  label,
  plannedReimbursementDate,
  supplier,
  type,
  userId,
}: Omit<
  PersonalExpense,
  "createdAt" | "id" | "reimbursedAt" | "scope" | "updatedAt"
> & { userId: string }) {
  const result = await getClient().from("personal_expenses").insert({
    amount,
    comment,
    expense_date: expenseDate,
    label,
    planned_reimbursement_date: plannedReimbursementDate,
    supplier,
    type,
    user_id: userId,
  });

  throwIfError(result.error);
}

export async function updatePersonalExpense({
  amount,
  comment,
  expenseDate,
  id,
  label,
  plannedReimbursementDate,
  supplier,
  type,
}: Omit<
  PersonalExpense,
  "createdAt" | "reimbursedAt" | "scope" | "updatedAt"
>) {
  const result = await getClient()
    .from("personal_expenses")
    .update({
      amount,
      comment,
      expense_date: expenseDate,
      label,
      planned_reimbursement_date: plannedReimbursementDate,
      supplier,
      type,
    })
    .eq("id", id)
    .is("reimbursed_at", null);

  throwIfError(result.error);
}

export async function deletePersonalExpense(id: string) {
  const result = await getClient()
    .from("personal_expenses")
    .delete()
    .eq("id", id)
    .is("reimbursed_at", null);

  throwIfError(result.error);
}

export async function reimbursePersonalExpense({
  id,
  reimbursementDate,
}: {
  id: string;
  reimbursementDate: string;
}) {
  const result = await getClient().rpc("reimburse_personal_expense", {
    reimbursement_date: reimbursementDate,
    target_personal_expense_id: id,
  });

  throwIfError(result.error);
  return result.data as string;
}
