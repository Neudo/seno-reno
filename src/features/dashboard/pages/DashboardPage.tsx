import { LogOut } from "lucide-react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import { Button } from "@/shared/components/ui/button";

export function DashboardPage() {
  const { signOut, user } = useAuth();

  return (
    <main className="min-h-svh bg-seno-50 p-6 sm:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-seno-100 pb-5">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-seno-700">
              SENO RÉNOVATION
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-seno-900">
              Tableau de bord
            </h1>
          </div>
          <Button onClick={() => void signOut()} variant="outline">
            <LogOut className="size-4" aria-hidden="true" />
            Se déconnecter
          </Button>
        </header>
        <section className="mt-10 border border-seno-100 bg-white p-6 sm:p-8">
          <p className="text-sm font-medium text-seno-500">Session active</p>
          <p className="mt-2 text-lg font-medium text-seno-900">
            {user?.email}
          </p>
          <p className="mt-6 max-w-xl text-sm leading-6 text-slate-600">
            Le tableau de bord métier sera construit dans la prochaine étape.
            Cette route confirme déjà que l’accès authentifié est bien séparé de
            la page de connexion.
          </p>
        </section>
      </div>
    </main>
  );
}
