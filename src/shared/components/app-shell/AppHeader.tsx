import { useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown } from "lucide-react";

export function AppHeader({ onSignOut }: { onSignOut: () => void }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isRoutine = pathname === "/routine";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <h1 className="text-base leading-tight font-semibold text-gray-900">
          {isRoutine ? "Routine du jour" : "Bonjour Pierre-Emmanuel"}
        </h1>
        <p className="mt-0.5 text-xs text-gray-500">
          {isRoutine
            ? "Checklist quotidienne — mardi 26 août 2026"
            : "Voici les éléments à surveiller aujourd'hui."}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="relative cursor-pointer p-2 transition-colors hover:bg-gray-100"
          type="button"
        >
          <Bell aria-hidden="true" className="size-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500" />
        </button>
        <button
          aria-label="Se déconnecter"
          className="flex cursor-pointer items-center gap-2 border border-gray-200 py-1.5 pr-2 pl-3 transition-colors hover:bg-gray-50"
          onClick={onSignOut}
          title="Se déconnecter"
          type="button"
        >
          <span className="flex size-6 items-center justify-center bg-[#00365A] text-xs font-semibold text-white">
            PE
          </span>
          <span className="hidden text-sm text-gray-700 md:block">
            P.-E. Martin
          </span>
          <ChevronDown aria-hidden="true" className="size-3 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
