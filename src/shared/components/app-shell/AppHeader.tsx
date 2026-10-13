import { useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, Menu } from "lucide-react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  getAccountPresentation,
  getPageHeader,
} from "@/shared/config/page-header";

export function AppHeader({
  isMobileNavigationOpen,
  onMobileNavigationOpen,
  onSignOut,
}: {
  isMobileNavigationOpen: boolean;
  onMobileNavigationOpen: () => void;
  onSignOut: () => void;
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { user } = useAuth();
  const account = getAccountPresentation(user);
  const { title, subtitle } = getPageHeader(pathname, account.firstName);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          aria-expanded={isMobileNavigationOpen}
          aria-label="Ouvrir la navigation"
          className="grid size-9 shrink-0 cursor-pointer place-items-center border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 lg:hidden"
          onClick={onMobileNavigationOpen}
          type="button"
        >
          <Menu aria-hidden="true" className="size-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base leading-tight font-semibold text-gray-900">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          aria-label="Notifications indisponibles"
          className="relative p-2"
          disabled
          title="Les notifications ne sont pas encore disponibles."
          type="button"
        >
          <Bell aria-hidden="true" className="size-4 text-gray-500" />
        </button>
        <button
          aria-label="Se déconnecter"
          className="flex cursor-pointer items-center gap-2 border border-gray-200 py-1.5 pr-2 pl-3 transition-colors hover:bg-gray-50"
          onClick={onSignOut}
          title="Se déconnecter"
          type="button"
        >
          <span className="flex size-6 items-center justify-center bg-[#00365A] text-xs font-semibold text-white">
            {account.initials}
          </span>
          <span
            className="hidden max-w-48 truncate text-sm text-gray-700 md:block"
            title={account.displayName}
          >
            {account.displayName}
          </span>
          <ChevronDown aria-hidden="true" className="size-3 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
