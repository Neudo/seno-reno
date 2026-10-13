import { supabase } from "@/features/auth/api/supabase-client";

export type RoutineItem = {
  id: string;
  categoryId: string;
  title: string;
  position: number;
  isCustom: boolean;
  isPermanent: boolean;
  sourceTag: string | null;
  isUrgent: boolean;
};

export type RoutineCategory = {
  id: string;
  name: string;
  color: string;
  position: number;
  items: RoutineItem[];
};

export type RoutineSnapshot = {
  completedItemIds: Set<string>;
  routineDate: string;
  sections: RoutineCategory[];
};

type RoutineCategoryRow = {
  color: string;
  id: string;
  name: string;
  position: number;
};

type RoutineCompletionRow = {
  routine_item_id: string;
};

type RoutineItemRow = {
  category_id: string;
  id: string;
  is_permanent: boolean;
  is_urgent: boolean;
  position: number;
  source_key: string | null;
  source_tag: string | null;
  title: string;
};

function getClient() {
  if (!supabase) {
    throw new Error("Supabase n'est pas configuré.");
  }

  return supabase;
}

function getRoutineDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Paris",
    year: "numeric",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return values.year + "-" + values.month + "-" + values.day;
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export async function getRoutineSnapshot(): Promise<RoutineSnapshot> {
  const client = getClient();
  const routineDate = getRoutineDate();
  const [categoriesResult, itemsResult, completionsResult] = await Promise.all([
    client
      .from("routine_categories")
      .select("id, name, color, position")
      .order("position", { ascending: true }),
    client
      .from("routine_items")
      .select(
        "id, category_id, title, position, is_permanent, source_key, source_tag, is_urgent",
      )
      .order("position", { ascending: true }),
    client
      .from("routine_item_completions")
      .select("routine_item_id")
      .eq("routine_date", routineDate),
  ]);

  throwIfError(categoriesResult.error);
  throwIfError(itemsResult.error);
  throwIfError(completionsResult.error);

  const itemsByCategory = new Map<string, RoutineItem[]>();
  for (const item of (itemsResult.data ?? []) as RoutineItemRow[]) {
    const categoryItems = itemsByCategory.get(item.category_id) ?? [];
    categoryItems.push({
      categoryId: item.category_id,
      id: item.id,
      isCustom: item.source_key === null,
      isPermanent: item.is_permanent,
      isUrgent: item.is_urgent,
      position: item.position,
      sourceTag: item.source_tag,
      title: item.title,
    });
    itemsByCategory.set(item.category_id, categoryItems);
  }

  return {
    completedItemIds: new Set(
      ((completionsResult.data ?? []) as RoutineCompletionRow[]).map(
        (completion) => completion.routine_item_id,
      ),
    ),
    routineDate,
    sections: ((categoriesResult.data ?? []) as RoutineCategoryRow[]).map(
      (category) => ({
        color: category.color,
        id: category.id,
        items: itemsByCategory.get(category.id) ?? [],
        name: category.name,
        position: category.position,
      }),
    ),
  };
}

export async function toggleRoutineItemCompletion({
  completed,
  itemId,
  routineDate,
  userId,
}: {
  completed: boolean;
  itemId: string;
  routineDate: string;
  userId: string;
}) {
  const client = getClient();

  if (completed) {
    const result = await client
      .from("routine_item_completions")
      .delete()
      .eq("routine_item_id", itemId)
      .eq("routine_date", routineDate);
    throwIfError(result.error);
    return;
  }

  const result = await client.from("routine_item_completions").upsert(
    {
      routine_date: routineDate,
      routine_item_id: itemId,
      user_id: userId,
    },
    {
      ignoreDuplicates: true,
      onConflict: "user_id,routine_item_id,routine_date",
    },
  );
  throwIfError(result.error);
}

export async function resetRoutineDay({
  itemIds,
  routineDate,
}: {
  itemIds: string[];
  routineDate: string;
}) {
  if (itemIds.length === 0) {
    return;
  }

  const result = await getClient()
    .from("routine_item_completions")
    .delete()
    .eq("routine_date", routineDate)
    .in("routine_item_id", itemIds);
  throwIfError(result.error);
}

export async function createRoutineItem({
  categoryId,
  position,
  title,
  userId,
}: {
  categoryId: string;
  position: number;
  title: string;
  userId: string;
}) {
  const result = await getClient().from("routine_items").insert({
    category_id: categoryId,
    is_permanent: true,
    position,
    title,
    user_id: userId,
  });
  throwIfError(result.error);
}

export async function updateRoutineItemTitle({
  itemId,
  title,
}: {
  itemId: string;
  title: string;
}) {
  const result = await getClient()
    .from("routine_items")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", itemId);
  throwIfError(result.error);
}

export async function deleteRoutineItem(itemId: string) {
  const result = await getClient()
    .from("routine_items")
    .delete()
    .eq("id", itemId);
  throwIfError(result.error);
}

export async function createRoutineCategory({
  color,
  name,
  position,
  userId,
}: {
  color: string;
  name: string;
  position: number;
  userId: string;
}) {
  const result = await getClient().from("routine_categories").insert({
    color,
    name,
    position,
    user_id: userId,
  });
  throwIfError(result.error);
}

export async function updateRoutineCategory({
  categoryId,
  color,
  name,
}: {
  categoryId: string;
  color?: string;
  name?: string;
}) {
  const result = await getClient()
    .from("routine_categories")
    .update({
      ...(color === undefined ? {} : { color }),
      ...(name === undefined ? {} : { name }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);
  throwIfError(result.error);
}

export async function deleteRoutineCategory(categoryId: string) {
  const result = await getClient()
    .from("routine_categories")
    .delete()
    .eq("id", categoryId);
  throwIfError(result.error);
}

export async function updateRoutineCategoryOrder(categoryIds: string[]) {
  await Promise.all(
    categoryIds.map(async (categoryId, position) => {
      const result = await getClient()
        .from("routine_categories")
        .update({ position, updated_at: new Date().toISOString() })
        .eq("id", categoryId);
      throwIfError(result.error);
    }),
  );
}

export async function updateRoutineItemOrder(itemIds: string[]) {
  await Promise.all(
    itemIds.map(async (itemId, position) => {
      const result = await getClient()
        .from("routine_items")
        .update({ position, updated_at: new Date().toISOString() })
        .eq("id", itemId);
      throwIfError(result.error);
    }),
  );
}
