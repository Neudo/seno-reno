import type { ShoppingItem } from "@/features/achats/api/shopping-list-api";

export type ShoppingFilter = "TO_BUY" | "PURCHASED" | "ALL";

export function getShoppingListView(
  items: ShoppingItem[],
  filter: ShoppingFilter,
) {
  const toBuy = items.filter((item) => !item.purchasedAt);
  const purchased = items.filter((item) => Boolean(item.purchasedAt));
  const filtered =
    filter === "TO_BUY" ? toBuy : filter === "PURCHASED" ? purchased : items;
  const groups = new Map<
    string,
    { id: string; label: string; items: ShoppingItem[] }
  >();
  if (filter === "ALL" && filtered.length) {
    groups.set("all", {
      id: "all",
      label: "Tous les articles",
      items: filtered,
    });
  } else {
    for (const item of filtered) {
      const id = item.chantierId ?? "manual";
      const group = groups.get(id) ?? {
        id,
        label: item.chantierName ?? "Divers",
        items: [],
      };
      group.items.push(item);
      groups.set(id, group);
    }
  }
  return {
    toBuyCount: toBuy.length,
    purchasedCount: purchased.length,
    totalEstimate: toBuy.reduce(
      (sum, item) => sum + (item.estimatedAmount ?? 0),
      0,
    ),
    groups: [...groups.values()].sort((left, right) =>
      left.id === "manual" ? 1 : right.id === "manual" ? -1 : 0,
    ),
  };
}

export function parseEstimatedAmount(value: string) {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(normalized)) {
    throw new Error(
      "Le montant estimé doit être un nombre positif ou nul, avec deux décimales au maximum.",
    );
  }
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount > 9_999_999_999.99)
    throw new Error("Le montant estimé est trop élevé.");
  return amount;
}

export function serializePurchaseQuantity(value: string) {
  const quantityLabel = value.trim();
  if (quantityLabel.length > 120)
    throw new Error("La quantité est limitée à 120 caractères.");
  const normalized = quantityLabel.replace(",", ".");
  const quantity = /^\d+(?:\.\d{1,3})?$/.test(normalized)
    ? Number(normalized)
    : null;
  if (
    quantity !== null &&
    (!Number.isFinite(quantity) || quantity > 999_999_999.999)
  ) {
    throw new Error("La quantité est trop élevée.");
  }
  return { quantity, quantityLabel };
}
