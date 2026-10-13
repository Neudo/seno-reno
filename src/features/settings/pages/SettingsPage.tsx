import { Link } from "@tanstack/react-router";
import { ChevronRight, ClipboardList } from "lucide-react";

export function SettingsPage() {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-background">
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-6">
        <section className="divide-y divide-gray-100 border border-gray-200 bg-white">
          <div className="px-5 py-4">
            <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase">
              Personnalisation
            </h2>
          </div>
          <Link
            className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
            to="/routine/parametres"
          >
            <span className="grid size-8 shrink-0 place-items-center bg-seno-muted">
              <ClipboardList
                aria-hidden="true"
                className="size-4 text-seno-700"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-gray-900 transition-colors group-hover:text-seno-700">
                Routine quotidienne
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Gérer les catégories et tâches permanentes de la routine du
                matin
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="size-3.5 shrink-0 text-gray-400"
            />
          </Link>
        </section>
      </div>
    </main>
  );
}
