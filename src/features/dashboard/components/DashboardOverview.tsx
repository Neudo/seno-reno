const keyMetrics = [
  "Chantiers en cours",
  "Devis à relancer",
  "Paiements à effectuer",
  "Encaissements à venir",
];

const cashflowMetrics = [
  "Encaissements prévus",
  "Décaissements prévus",
  "Solde prévisionnel",
];

function MetricCard({ label }: { label: string }) {
  return (
    <article className="min-h-28 border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium tracking-[0.08em] text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-slate-300">
        —
      </p>
    </article>
  );
}

export function DashboardOverview() {
  return (
    <main className="min-w-0 flex-1 overflow-auto bg-[#f7f8f9] p-5 sm:p-7">
      <div className="mx-auto grid max-w-7xl gap-6">
        <section
          aria-label="Indicateurs de suivi"
          className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4"
        >
          {keyMetrics.map((label) => (
            <MetricCard key={label} label={label} />
          ))}
        </section>

        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-[0.06em] text-slate-900 uppercase">
              Trésorerie à venir
            </h2>
            <p className="mt-1 text-xs text-slate-500">30 prochains jours</p>
          </div>
          <div className="grid grid-cols-1 gap-px bg-slate-200 md:grid-cols-3">
            {cashflowMetrics.map((label) => (
              <MetricCard key={label} label={label} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
