import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Banknote,
  CreditCard,
  ExternalLink,
  FileText,
  HardHat,
  Receipt,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { lazy, Suspense } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import { getChantierSnapshot } from "@/features/chantiers/api/chantiers-api";
import { getQuoteSnapshot } from "@/features/devis/api/quotes-api";
import { getFinanceSnapshot } from "@/features/finances/api/finance-api";
import { getTodayIso } from "@/features/finances/components/finance-ui";
import { getDashboardSummary } from "@/features/dashboard/lib/dashboard";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const dateLabel = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});
const date = (value: string) => dateLabel.format(new Date(value + "T12:00:00"));

const DashboardCashflowChart = lazy(() => import("./DashboardCashflowChart"));

export function DashboardOverview() {
  const { user } = useAuth();
  const chantierQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ["chantiers", user?.id],
    queryFn: getChantierSnapshot,
  });
  const quoteQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ["quotes", user?.id],
    queryFn: getQuoteSnapshot,
  });
  const financeQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ["finance-snapshot", user?.id],
    queryFn: getFinanceSnapshot,
  });
  const summary = getDashboardSummary({
    chantiers: chantierQuery.data?.chantiers ?? [],
    quotes: quoteQuery.data?.quotes ?? [],
    movements: financeQuery.data?.cashMovements ?? [],
    today: getTodayIso(),
  });
  const chantierValue = chantierQuery.isSuccess
    ? String(summary.activeChantiers.length)
    : "—";
  const income = financeQuery.isSuccess ? currency.format(summary.income) : "—";
  const outgoing = financeQuery.isSuccess
    ? currency.format(summary.outgoing)
    : "—";
  const net = financeQuery.isSuccess
    ? currency.format(summary.income - summary.outgoing)
    : "—";
  const kpis = [
    {
      icon: HardHat,
      label: "Chantiers en cours",
      value: chantierValue,
      detail: "Chantiers au statut « En cours »",
      color: "#00365A",
      path: "/chantiers" as const,
    },
    {
      icon: FileText,
      label: "Devis à relancer",
      value: quoteQuery.isSuccess ? String(summary.toFollowUp.length) : "—",
      detail: "Relances enregistrées à effectuer",
      color: "#B45309",
      path: "/devis" as const,
    },
    {
      icon: CreditCard,
      label: "Paiements à effectuer",
      value: financeQuery.isSuccess ? String(summary.toPay.length) : "—",
      detail: "Mouvements prévus et échus",
      color: "#B91C1C",
      path: "/tresorerie" as const,
    },
    {
      icon: TrendingUp,
      label: "Encaissements attendus",
      value: income,
      detail: "Sur les 30 prochains jours",
      color: "#166534",
      path: "/tresorerie" as const,
    },
  ];
  const queryError =
    chantierQuery.isError || quoteQuery.isError || financeQuery.isError;

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-background">
      <div className="mx-auto max-w-screen-xl space-y-5 px-4 py-6 sm:px-6">
        {queryError ? (
          <p
            role="alert"
            className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Certaines données du tableau de bord n'ont pas pu être chargées. Les
            indicateurs concernés restent indisponibles.
          </p>
        ) : null}
        <section
          aria-label="Indicateurs de suivi"
          className="grid grid-cols-2 gap-px border border-gray-200 bg-gray-200 lg:grid-cols-4"
        >
          {kpis.map(({ icon: Icon, label, value, detail, color, path }) => (
            <Link
              className="group flex flex-col gap-2 bg-white px-5 py-4 transition-colors hover:bg-gray-50"
              key={label}
              to={path}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                  {label}
                </span>
                <Icon
                  aria-hidden="true"
                  className="size-3.5 shrink-0 opacity-60"
                  style={{ color }}
                />
              </span>
              <span
                className="font-mono text-2xl font-medium tracking-tight"
                style={{ color }}
              >
                {value}
              </span>
              <span className="text-xs text-gray-400">{detail}</span>
            </Link>
          ))}
        </section>
        <section
          aria-label="Accès rapides"
          className="grid grid-cols-1 gap-px border border-gray-200 bg-gray-200 md:grid-cols-3"
        >
          <Link
            className="group flex flex-col gap-3 bg-white px-5 py-4 text-left transition-colors hover:bg-gray-50"
            to="/tresorerie"
          >
            <span className="flex items-start justify-between">
              <span className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center bg-green-50">
                  <Banknote
                    aria-hidden="true"
                    className="size-[15px] text-green-800"
                  />
                </span>
                <span>
                  <span className="block text-xs font-semibold tracking-wider text-gray-900 uppercase">
                    Trésorerie
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-400">
                    Solde prévisionnel 30 j.
                  </span>
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="mt-1 size-3.5 text-gray-300"
              />
            </span>
            <span>
              <span className="block font-mono text-2xl font-medium tracking-tight text-green-800">
                {net}
              </span>
              <span className="mt-1 block text-xs text-gray-400">
                Différence des encaissements et décaissements prévus
              </span>
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-green-800">
              Voir la trésorerie
              <ArrowRight aria-hidden="true" className="size-[11px]" />
            </span>
          </Link>
          {[
            {
              icon: ShoppingCart,
              title: "Commandes à passer",
              color: "#B45309",
              background: "#FFFBEB",
              action: "Voir les commandes",
            },
            {
              icon: Receipt,
              title: "Acomptes à appeler",
              color: "#7C3AED",
              background: "#F5F3FF",
              action: "Voir les acomptes",
            },
          ].map(({ icon: Icon, title, color, background, action }) => (
            <div className="flex flex-col gap-3 bg-white px-5 py-4" key={title}>
              <div className="flex items-center gap-2.5">
                <span
                  className="grid size-8 place-items-center"
                  style={{ background }}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-[15px]"
                    style={{ color }}
                  />
                </span>
                <div>
                  <p className="text-xs font-semibold tracking-wider text-gray-900 uppercase">
                    {title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Synthèse non raccordée
                  </p>
                </div>
              </div>
              <div>
                <p
                  className="font-mono text-2xl font-medium tracking-tight"
                  style={{ color }}
                >
                  —
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Consultez les données dans chaque chantier.
                </p>
              </div>
              <Link
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color }}
                to="/chantiers"
              >
                {action}
                <ArrowRight aria-hidden="true" className="size-[11px]" />
              </Link>
            </div>
          ))}
        </section>
        <section className="border border-gray-200 bg-white">
          <header className="border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold tracking-wider text-gray-900 uppercase">
              Trésorerie à venir
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              30 prochains jours · mouvements enregistrés
            </p>
          </header>
          <div className="mb-4 grid grid-cols-3 gap-px border-b border-gray-100 bg-gray-100 px-5 py-4">
            {[
              {
                label: "Encaissements prévus",
                value: income,
                color: "#166534",
              },
              {
                label: "Décaissements prévus",
                value: outgoing,
                color: "#B91C1C",
              },
              { label: "Solde prévisionnel", value: net, color: "#00365A" },
            ].map(({ label, value, color }) => (
              <div className="bg-white px-4 py-3" key={label}>
                <p className="mb-1 text-xs text-gray-500">{label}</p>
                <p className="font-mono text-lg font-medium" style={{ color }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 pb-4">
            <p className="mb-3 text-xs tracking-wider text-gray-400 uppercase">
              Par semaine
            </p>
            {financeQuery.isSuccess &&
            financeQuery.data.cashMovements.length > 0 ? (
              <Suspense fallback={<div aria-busy="true" className="h-40" />}>
                <DashboardCashflowChart weeks={summary.weeks} />
              </Suspense>
            ) : (
              <p className="grid h-40 place-items-center text-center text-sm text-gray-400">
                {financeQuery.isPending
                  ? "Chargement de la trésorerie…"
                  : "Aucun mouvement de trésorerie à afficher."}
              </p>
            )}
          </div>
        </section>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
          <section className="border border-gray-200 bg-white">
            <header className="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold tracking-wider text-gray-900 uppercase">
                Chantiers à surveiller
              </h2>
              <Link
                className="flex items-center gap-1 text-xs font-medium text-seno-700 hover:underline"
                to="/chantiers"
              >
                Tous les chantiers
                <ExternalLink aria-hidden="true" className="size-2.5" />
              </Link>
            </header>
            <div className="divide-y divide-gray-100">
              {summary.activeChantiers.slice(0, 3).map((chantier) => (
                <Link
                  className="group block px-5 py-4 transition-colors hover:bg-gray-50"
                  key={chantier.id}
                  params={{ chantierId: chantier.id }}
                  to="/chantiers/$chantierId"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-seno-700">
                        {chantier.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {chantier.clientName}
                      </p>
                    </div>
                    <span className="shrink-0 border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      En cours
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Avancement</span>
                    <span className="font-mono text-gray-700">—</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-100" />
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>
                      Fin prévue :{" "}
                      <span className="font-medium text-gray-700">
                        {chantier.plannedEndDate
                          ? date(chantier.plannedEndDate)
                          : "—"}
                      </span>
                    </span>
                    <span>
                      Marge : <span className="font-mono text-gray-700">—</span>
                    </span>
                  </div>
                </Link>
              ))}
              {summary.activeChantiers.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-gray-400">
                  {chantierQuery.isPending
                    ? "Chargement des chantiers…"
                    : "Aucun chantier en cours à afficher."}
                </p>
              ) : null}
            </div>
          </section>
          <section className="border border-gray-200 bg-white">
            <header className="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold tracking-wider text-gray-900 uppercase">
                À venir
              </h2>
              <Link
                className="flex items-center gap-1 text-xs font-medium text-seno-700 hover:underline"
                to="/planning"
              >
                Planning complet
                <ExternalLink aria-hidden="true" className="size-2.5" />
              </Link>
            </header>
            <div className="divide-y divide-gray-100">
              {summary.upcoming.map((event) => (
                <Link
                  className="group flex items-start gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50"
                  key={event.chantier.id + event.label}
                  params={{ chantierId: event.chantier.id }}
                  to="/chantiers/$chantierId"
                >
                  <div className="w-14 shrink-0 text-center">
                    <div className="text-xs font-medium text-gray-400">
                      {new Intl.DateTimeFormat("fr-FR", {
                        weekday: "short",
                      }).format(new Date(event.date + "T12:00:00"))}
                    </div>
                    <div className="mt-0.5 font-mono text-sm font-medium text-gray-800">
                      {date(event.date)}
                    </div>
                  </div>
                  <span
                    className="mt-1 w-0.5 shrink-0 self-stretch opacity-50"
                    style={{ background: event.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug text-gray-900 group-hover:text-seno-700">
                      {event.label}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {event.chantier.name}
                    </p>
                    <span
                      className="mt-1 inline-block border px-1.5 py-0.5 text-xs font-medium"
                      style={{
                        color: event.color,
                        backgroundColor: event.color + "12",
                        borderColor: event.color + "30",
                      }}
                    >
                      {event.label}
                    </span>
                  </div>
                </Link>
              ))}
              {summary.upcoming.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-gray-400">
                  {chantierQuery.isPending
                    ? "Chargement du planning…"
                    : "Aucune date de chantier dans les 30 prochains jours."}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
