import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import { Check, Plus, ShoppingBasket, Trash2, X } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  createShoppingItem,
  getShoppingList,
  removeShoppingItem,
  toggleShoppingItem,
  type ShoppingItemInput,
} from "@/features/achats/api/shopping-list-api";
import {
  getShoppingListView,
  parseEstimatedAmount,
  type ShoppingFilter,
} from "@/features/achats/lib/shopping-list";
import { cn } from "@/shared/lib/utils";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const emptyForm = { title: "", quantity: "", supplier: "", amount: "" };
const inputClassName =
  "w-full border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-seno-700";

export function AchatsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ShoppingFilter>("TO_BUY");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const shoppingQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ["shopping-list", user?.id],
    queryFn: getShoppingList,
  });
  const items = shoppingQuery.data ?? [];
  const view = getShoppingListView(items, filter);
  const userId = user?.id ?? "";
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["shopping-list", userId] }),
      queryClient.invalidateQueries({ queryKey: ["chantier", userId] }),
    ]);
  };
  const createMutation = useMutation({
    mutationFn: (input: ShoppingItemInput) =>
      createShoppingItem({ input, userId }),
    onSuccess: async () => {
      setShowForm(false);
      setForm(emptyForm);
      setFormError(null);
      await invalidate();
    },
  });
  const toggleMutation = useMutation({
    mutationFn: toggleShoppingItem,
    onSuccess: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: removeShoppingItem,
    onSuccess: invalidate,
  });
  const mutationError = toggleMutation.error ?? removeMutation.error;
  const filters = [
    { id: "TO_BUY" as const, label: "À acheter", count: view.toBuyCount },
    { id: "PURCHASED" as const, label: "Achetés", count: view.purchasedCount },
    { id: "ALL" as const, label: "Tous", count: items.length },
  ];
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      await createMutation.mutateAsync({
        title: form.title,
        quantity: form.quantity,
        supplier: form.supplier,
        estimatedAmount: parseEstimatedAmount(form.amount),
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "L’article n’a pas pu être ajouté.",
      );
    }
  }

  return (
    <Dialog.Root
      open={showForm}
      onOpenChange={(open) => {
        if (!createMutation.isPending) {
          setShowForm(open);
          setFormError(null);
        }
      }}
    >
      <main className="min-w-0 flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-gray-900">
                <ShoppingBasket
                  aria-hidden="true"
                  className="size-[18px] text-seno-700"
                />
                Liste de courses
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Articles à acheter — chantiers et divers
              </p>
            </div>
            <Dialog.Trigger asChild>
              <button
                className="flex cursor-pointer items-center gap-2 bg-seno-700 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-seno-800"
                type="button"
              >
                <Plus aria-hidden="true" className="size-3.5" />
                Ajouter un article
              </button>
            </Dialog.Trigger>
          </div>
          <section
            aria-label="Résumé des achats"
            className="grid grid-cols-3 gap-px border border-gray-200 bg-gray-200"
          >
            {[
              {
                label: "À acheter",
                value: shoppingQuery.isSuccess ? view.toBuyCount : "—",
                tone: "text-seno-700",
              },
              {
                label: "Montant estimé",
                value:
                  shoppingQuery.isSuccess && view.totalEstimate > 0
                    ? currency.format(view.totalEstimate)
                    : "—",
                tone: "text-amber-700",
              },
              {
                label: "Achetés",
                value: shoppingQuery.isSuccess ? view.purchasedCount : "—",
                tone: "text-emerald-700",
              },
            ].map(({ label, value, tone }) => (
              <article className="bg-white px-3 py-4 sm:px-5" key={label}>
                <p className="mb-1 text-xs tracking-wider text-gray-500 uppercase">
                  {label}
                </p>
                <p className={cn("font-mono text-2xl font-medium", tone)}>
                  {value}
                </p>
              </article>
            ))}
          </section>
          <div
            aria-label="Filtrer les achats"
            className="flex w-fit gap-px border border-gray-200 bg-gray-200"
            role="group"
          >
            {filters.map((entry) => (
              <button
                aria-pressed={filter === entry.id}
                className={cn(
                  "cursor-pointer px-4 py-2 text-xs font-medium transition-colors",
                  filter === entry.id
                    ? "bg-seno-700 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50",
                )}
                key={entry.id}
                onClick={() => setFilter(entry.id)}
                type="button"
              >
                {entry.label}
                <span
                  className={cn(
                    "ml-1.5 font-mono",
                    filter === entry.id ? "text-white/70" : "text-gray-400",
                  )}
                >
                  {entry.count}
                </span>
              </button>
            ))}
          </div>
          {mutationError ? (
            <p
              role="alert"
              className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {mutationError.message}
            </p>
          ) : null}
          {shoppingQuery.isError ? (
            <div
              role="alert"
              className="border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            >
              <p>
                Impossible de charger la liste de courses. Vérifiez que la
                migration Achats est appliquée, puis réessayez.
              </p>
              <button
                className="mt-2 cursor-pointer underline"
                onClick={() => void shoppingQuery.refetch()}
                type="button"
              >
                Réessayer
              </button>
            </div>
          ) : null}
          {shoppingQuery.isPending ? (
            <div
              role="status"
              className="border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-400"
            >
              Chargement des articles…
            </div>
          ) : null}
          <div className="space-y-4">
            {shoppingQuery.isSuccess && view.groups.length === 0 ? (
              <p className="border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-400">
                {filter === "TO_BUY" && items.length > 0
                  ? "Tout est acheté ! 🎉"
                  : "Aucun article dans ce filtre."}
              </p>
            ) : null}
            {view.groups.map((group) => (
              <section
                className="border border-gray-200 bg-white"
                key={group.id}
              >
                {view.groups.length > 1 ? (
                  <header className="border-b border-gray-100 bg-gray-50 px-5 py-2.5">
                    <h2 className="truncate text-xs font-semibold tracking-wider text-gray-500 uppercase">
                      {group.label}
                    </h2>
                  </header>
                ) : null}
                <ul className="divide-y divide-gray-50">
                  {group.items.map((item) => {
                    const purchased = Boolean(item.purchasedAt);
                    const itemKey = item.source + "-" + item.id;
                    const busy =
                      (toggleMutation.isPending &&
                        toggleMutation.variables?.item.id === item.id) ||
                      (removeMutation.isPending &&
                        removeMutation.variables?.item.id === item.id);
                    return (
                      <li
                        className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50"
                        key={itemKey}
                      >
                        <input
                          aria-label={
                            purchased
                              ? "Marquer " + item.title + " comme à acheter"
                              : "Marquer " + item.title + " comme acheté"
                          }
                          checked={purchased}
                          className="peer sr-only"
                          disabled={busy}
                          id={itemKey}
                          onChange={() => {
                            toggleMutation.reset();
                            removeMutation.reset();
                            toggleMutation.mutate({ item, userId });
                          }}
                          type="checkbox"
                        />
                        <label
                          className={cn(
                            "grid size-5 shrink-0 cursor-pointer place-items-center border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-seno-700",
                            purchased
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-gray-300 hover:border-seno-700",
                            busy && "cursor-wait opacity-50",
                          )}
                          htmlFor={itemKey}
                        >
                          {purchased ? (
                            <Check
                              aria-hidden="true"
                              className="size-[11px] text-white"
                              strokeWidth={3}
                            />
                          ) : null}
                        </label>
                        <div className="min-w-0 flex-1">
                          <label
                            className={cn(
                              "block cursor-pointer text-sm font-medium leading-tight",
                              purchased
                                ? "text-gray-400 line-through"
                                : "text-gray-900",
                            )}
                            htmlFor={itemKey}
                          >
                            {item.title}
                          </label>
                          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                            {item.quantity ? (
                              <span>{item.quantity}</span>
                            ) : null}
                            {item.supplier ? (
                              <>
                                {item.quantity ? (
                                  <span className="text-gray-200">·</span>
                                ) : null}
                                <span>{item.supplier}</span>
                              </>
                            ) : null}
                          </p>
                        </div>
                        {item.estimatedAmount !== null ? (
                          <span
                            className={cn(
                              "shrink-0 font-mono text-sm font-medium",
                              purchased ? "text-gray-300" : "text-gray-700",
                            )}
                          >
                            {currency.format(item.estimatedAmount)}
                          </span>
                        ) : null}
                        <button
                          aria-label={
                            "Retirer " + item.title + " de la liste de courses"
                          }
                          className="shrink-0 cursor-pointer text-gray-300 opacity-0 transition-all hover:text-red-500 focus-visible:opacity-100 disabled:cursor-wait group-hover:opacity-100 max-sm:opacity-100"
                          disabled={busy}
                          onClick={() => {
                            removeMutation.reset();
                            toggleMutation.reset();
                            removeMutation.mutate({ item, userId });
                          }}
                          title={
                            item.source === "CHANTIER"
                              ? "Retirer de la liste sans supprimer l’achat du chantier"
                              : "Supprimer cet article"
                          }
                          type="button"
                        >
                          <Trash2 aria-hidden="true" className="size-[13px]" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[420px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-white shadow-xl outline-none">
          <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <Dialog.Title className="text-sm font-semibold text-gray-800">
              Ajouter un article
            </Dialog.Title>
            <Dialog.Close
              aria-label="Fermer"
              className="cursor-pointer text-gray-400 hover:text-gray-600"
              disabled={createMutation.isPending}
            >
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </header>
          <Dialog.Description className="sr-only">
            Ajouter un article à la liste de courses, dans Divers.
          </Dialog.Description>
          <form onSubmit={(event) => void submit(event)}>
            <div className="space-y-3 px-6 py-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">
                  Article *
                </span>
                <input
                  autoFocus
                  className={inputClassName}
                  maxLength={240}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Article à acheter"
                  required
                  value={form.title}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-500">
                    Quantité
                  </span>
                  <input
                    className={inputClassName}
                    maxLength={120}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    placeholder="Ex. : 3 rouleaux"
                    value={form.quantity}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-500">
                    Montant estimé (€)
                  </span>
                  <input
                    className={inputClassName}
                    inputMode="decimal"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    value={form.amount}
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">
                  Fournisseur
                </span>
                <input
                  className={inputClassName}
                  maxLength={240}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      supplier: event.target.value,
                    }))
                  }
                  value={form.supplier}
                />
              </label>
              {formError ? (
                <p role="alert" className="text-sm text-red-700">
                  {formError}
                </p>
              ) : null}
            </div>
            <footer className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <Dialog.Close
                className="cursor-pointer border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                disabled={createMutation.isPending}
              >
                Annuler
              </Dialog.Close>
              <button
                className="cursor-pointer bg-seno-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-seno-800 disabled:cursor-wait disabled:opacity-50"
                disabled={createMutation.isPending || !user}
                type="submit"
              >
                {createMutation.isPending ? "Ajout…" : "Ajouter"}
              </button>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
