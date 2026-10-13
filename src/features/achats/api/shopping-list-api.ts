import { supabase } from "@/features/auth/api/supabase-client";

export type ShoppingItem = {
  id: string;
  source: "CHANTIER" | "MANUAL";
  chantierId: string | null;
  chantierName: string | null;
  title: string;
  quantity: string;
  supplier: string;
  estimatedAmount: number | null;
  purchasedAt: string | null;
  createdAt: string;
};

export type ShoppingItemInput = Pick<
  ShoppingItem,
  "title" | "quantity" | "supplier" | "estimatedAmount"
>;

type ManualRow = {
  id: string;
  title: string;
  quantity: string;
  supplier: string;
  estimated_amount: number | string | null;
  purchased_at: string | null;
  created_at: string;
};

type LinkedRow = Omit<ManualRow, "quantity" | "estimated_amount"> & {
  chantier_id: string;
  quantity: number | string | null;
  quantity_label?: string;
  forecast_amount: number | string | null;
  chantier: { id: string; name: string };
};

function getClient() {
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  return supabase;
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function getShoppingList(): Promise<ShoppingItem[]> {
  const client = getClient();
  const [manual, linked] = await Promise.all([
    client
      .from("shopping_list_items")
      .select(
        "id, title, quantity, supplier, estimated_amount, purchased_at, created_at",
      )
      .order("created_at", { ascending: false }),
    client
      .from("chantier_procurements")
      .select(
        "id, chantier_id, title, quantity, quantity_label, supplier, forecast_amount, purchased_at, created_at, chantier:chantiers!inner(id, name)",
      )
      .eq("kind", "PURCHASE")
      .eq("add_to_shopping_list", true)
      .order("created_at", { ascending: false }),
  ]);
  throwIfError(manual.error);
  throwIfError(linked.error);
  const amount = (value: number | string | null) =>
    value === null ? null : Number(value);
  return [
    ...((manual.data ?? []) as ManualRow[]).map((row): ShoppingItem => ({
      id: row.id,
      source: "MANUAL",
      chantierId: null,
      chantierName: null,
      title: row.title,
      quantity: row.quantity,
      supplier: row.supplier,
      estimatedAmount: amount(row.estimated_amount),
      purchasedAt: row.purchased_at,
      createdAt: row.created_at,
    })),
    ...((linked.data ?? []) as unknown as LinkedRow[]).map(
      (row): ShoppingItem => ({
        id: row.id,
        source: "CHANTIER",
        chantierId: row.chantier_id,
        chantierName: row.chantier.name,
        title: row.title,
        quantity:
          row.quantity_label ||
          (row.quantity === null
            ? ""
            : Number(row.quantity).toLocaleString("fr-FR")),
        supplier: row.supplier,
        estimatedAmount: amount(row.forecast_amount),
        purchasedAt: row.purchased_at,
        createdAt: row.created_at,
      }),
    ),
  ].sort(
    (left, right) =>
      right.createdAt.localeCompare(left.createdAt) ||
      left.id.localeCompare(right.id),
  );
}

export async function createShoppingItem({
  input,
  userId,
}: {
  input: ShoppingItemInput;
  userId: string;
}) {
  if (!input.title.trim()) throw new Error("L’article est requis.");
  if (
    input.estimatedAmount !== null &&
    (!Number.isFinite(input.estimatedAmount) || input.estimatedAmount < 0)
  ) {
    throw new Error("Le montant estimé doit être un nombre positif ou nul.");
  }
  const result = await getClient().from("shopping_list_items").insert({
    title: input.title.trim(),
    quantity: input.quantity.trim(),
    supplier: input.supplier.trim(),
    estimated_amount: input.estimatedAmount,
    user_id: userId,
  });
  throwIfError(result.error);
}

export async function toggleShoppingItem({
  item,
  userId,
}: {
  item: ShoppingItem;
  userId: string;
}) {
  const table =
    item.source === "CHANTIER"
      ? "chantier_procurements"
      : "shopping_list_items";
  let query = getClient()
    .from(table)
    .update({
      purchased_at: item.purchasedAt ? null : new Date().toISOString(),
    })
    .eq("id", item.id)
    .eq("user_id", userId);
  if (item.source === "CHANTIER")
    query = query.eq("kind", "PURCHASE").eq("add_to_shopping_list", true);
  const result = await query.select("id").single();
  throwIfError(result.error);
}

export async function removeShoppingItem({
  item,
  userId,
}: {
  item: ShoppingItem;
  userId: string;
}) {
  // Removing a linked entry must not erase the purchase or its chantier amount.
  const query =
    item.source === "CHANTIER"
      ? getClient()
          .from("chantier_procurements")
          .update({ add_to_shopping_list: false })
          .eq("kind", "PURCHASE")
      : getClient().from("shopping_list_items").delete();
  const result = await query
    .eq("id", item.id)
    .eq("user_id", userId)
    .select("id")
    .single();
  throwIfError(result.error);
}
