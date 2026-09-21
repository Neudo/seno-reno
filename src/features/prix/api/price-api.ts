import { supabase } from "@/features/auth/api/supabase-client";

export const priceItemTypes = [
  "FIXED",
  "PERCENTAGE",
  "TO_ESTIMATE",
  "COMMENT",
] as const;

export type PriceItemType = (typeof priceItemTypes)[number];

export type PriceCategory = {
  id: string;
  name: string;
  position: number;
};

export type PriceItem = {
  categoryId: string;
  code: string;
  comment: string;
  createdAt: string;
  designation: string;
  id: string;
  includeInQuote: boolean;
  isActive: boolean;
  price: number | null;
  requiresAdjustment: boolean;
  type: PriceItemType;
  unit: string;
  updatedAt: string;
};

export type PriceHistoryEntry = {
  changedAt: string;
  id: string;
  nextPrice: number | null;
  previousPrice: number | null;
};

export type PriceBaseSnapshot = {
  categories: PriceCategory[];
  items: PriceItem[];
};

type PriceCategoryRow = {
  id: string;
  name: string;
  position: number;
};

type PriceHistoryRow = {
  changed_at: string;
  id: string;
  next_price: number | string | null;
  previous_price: number | string | null;
};

type PriceItemRow = {
  category_id: string;
  code: string;
  comment: string;
  created_at: string;
  designation: string;
  id: string;
  include_in_quote: boolean;
  is_active: boolean;
  price: number | string | null;
  requires_adjustment: boolean;
  type: PriceItemType;
  unit: string;
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

function toNumber(value: number | string | null) {
  return value === null ? null : Number(value);
}

export async function getPriceBase(): Promise<PriceBaseSnapshot> {
  const client = getClient();
  const [categoriesResult, itemsResult] = await Promise.all([
    client
      .from("price_categories")
      .select("id, name, position")
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
    client
      .from("price_items")
      .select(
        "id, category_id, code, designation, type, unit, price, comment, requires_adjustment, include_in_quote, is_active, created_at, updated_at",
      )
      .order("is_active", { ascending: false })
      .order("designation", { ascending: true }),
  ]);

  throwIfError(categoriesResult.error);
  throwIfError(itemsResult.error);

  return {
    categories: ((categoriesResult.data ?? []) as PriceCategoryRow[]).map(
      (category) => ({
        id: category.id,
        name: category.name,
        position: category.position,
      }),
    ),
    items: ((itemsResult.data ?? []) as PriceItemRow[]).map((item) => ({
      categoryId: item.category_id,
      code: item.code,
      comment: item.comment,
      createdAt: item.created_at,
      designation: item.designation,
      id: item.id,
      includeInQuote: item.include_in_quote,
      isActive: item.is_active,
      price: toNumber(item.price),
      requiresAdjustment: item.requires_adjustment,
      type: item.type,
      unit: item.unit,
      updatedAt: item.updated_at,
    })),
  };
}

export async function getPriceItemHistory(itemId: string) {
  const result = await getClient()
    .from("price_item_history")
    .select("id, previous_price, next_price, changed_at")
    .eq("price_item_id", itemId)
    .order("changed_at", { ascending: false });

  throwIfError(result.error);

  return ((result.data ?? []) as PriceHistoryRow[]).map((entry) => ({
    changedAt: entry.changed_at,
    id: entry.id,
    nextPrice: toNumber(entry.next_price),
    previousPrice: toNumber(entry.previous_price),
  }));
}

export async function createPriceCategory({
  name,
  position,
  userId,
}: {
  name: string;
  position: number;
  userId: string;
}) {
  const result = await getClient()
    .from("price_categories")
    .insert({ name, position, user_id: userId })
    .select("id, name, position")
    .single();

  throwIfError(result.error);
  const category = result.data as PriceCategoryRow;

  return {
    id: category.id,
    name: category.name,
    position: category.position,
  } satisfies PriceCategory;
}

export async function createPriceItem({
  categoryId,
  code,
  comment,
  designation,
  includeInQuote,
  isActive,
  price,
  requiresAdjustment,
  type,
  unit,
  userId,
}: Omit<PriceItem, "createdAt" | "id" | "updatedAt"> & { userId: string }) {
  const result = await getClient().from("price_items").insert({
    category_id: categoryId,
    code,
    comment,
    designation,
    include_in_quote: includeInQuote,
    is_active: isActive,
    price,
    requires_adjustment: requiresAdjustment,
    type,
    unit,
    user_id: userId,
  });

  throwIfError(result.error);
}

export async function updatePriceItem({
  categoryId,
  code,
  comment,
  designation,
  id,
  includeInQuote,
  isActive,
  price,
  requiresAdjustment,
  type,
  unit,
}: Omit<PriceItem, "createdAt" | "updatedAt">) {
  const result = await getClient()
    .from("price_items")
    .update({
      category_id: categoryId,
      code,
      comment,
      designation,
      include_in_quote: includeInQuote,
      is_active: isActive,
      price,
      requires_adjustment: requiresAdjustment,
      type,
      unit,
    })
    .eq("id", id);

  throwIfError(result.error);
}

export async function deletePriceItem(itemId: string) {
  const result = await getClient().from("price_items").delete().eq("id", itemId);
  throwIfError(result.error);
}

export async function applyPriceIncrease({
  categoryId,
  percentage,
}: {
  categoryId: string | null;
  percentage: number;
}) {
  const result = await getClient().rpc("apply_price_increase", {
    increase_percentage: percentage,
    target_category_id: categoryId,
  });

  throwIfError(result.error);
  return Number(result.data ?? 0);
}
