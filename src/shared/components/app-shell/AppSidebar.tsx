import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import logoUrl from "@/assets/logo.png";
import {
  primaryNavigation,
  quickNavigation,
  settingsNavigation,
  type NavigationItem,
} from "@/shared/config/navigation";
import { cn } from "@/shared/lib/utils";

function NavigationRow({
  item,
  onNavigate,
}: {
  item: NavigationItem;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isCurrent = item.path === pathname;

  const content = (
    <>
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />
      <span>{item.label}</span>
    </>
  );

  const className = cn(
    "flex h-10 items-center gap-3 border-l-2 px-4 text-sm font-medium transition-colors",
    item.tone === "urgent"
      ? "mx-3 h-9 border border-[#D7BF54]/45 bg-[#D7BF54]/15 px-3 text-[#F6D95A] hover:bg-[#D7BF54]/22"
      : isCurrent
        ? "border-white bg-white/15 text-white"
        : "border-transparent text-white/60 hover:bg-white/8 hover:text-white",
  );

  if (item.path) {
    return (
      <Link
        aria-current={isCurrent ? "page" : undefined}
        className={className}
        onClick={onNavigate}
        to={item.path}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

function NavigationGroup({
  item,
  onNavigate,
}: {
  item: NavigationItem;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = item.icon;
  const hasCurrentChild = item.children?.some((child) => child.path === pathname);
  const isOpen = isExpanded || hasCurrentChild;

  return (
    <div>
      <button
        aria-expanded={isOpen}
        className={cn(
          "flex h-10 w-full items-center gap-3 border-l-2 px-4 text-left text-sm font-medium transition-colors",
          hasCurrentChild
            ? "border-white bg-white/15 text-white"
            : "border-transparent text-white/60 hover:bg-white/8 hover:text-white",
        )}
        onClick={() => setIsExpanded((expanded) => !expanded)}
        type="button"
      >
        <Icon
          aria-hidden="true"
          className="size-4 shrink-0"
          strokeWidth={1.8}
        />
        <span className="flex-1">{item.label}</span>
        {isOpen ? (
          <ChevronDown aria-hidden="true" className="size-4" />
        ) : (
          <ChevronRight aria-hidden="true" className="size-4" />
        )}
      </button>

      {isOpen ? (
        <div className="border-l-2 border-transparent pb-1 pl-11 pr-3 pt-1">
          {item.children?.map((child) => (
            <Link
              aria-current={child.path === pathname ? "page" : undefined}
              className={cn(
                "block py-1.5 text-sm transition-colors",
                child.path === pathname
                  ? "text-white"
                  : "text-white/55 hover:text-white",
              )}
              key={child.path}
              onClick={onNavigate}
              to={child.path}
            >
              {child.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SidebarContent({
  onClose,
  onNavigate,
  showCloseButton = false,
}: {
  onClose?: () => void;
  onNavigate?: () => void;
  showCloseButton?: boolean;
}) {
  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-white/15 px-4 text-white">
        <img alt="" className="size-8 object-contain" src={logoUrl} />
        <span className="flex-1 text-sm font-medium">SENO Rénovation</span>
        {showCloseButton ? (
          <button
            aria-label="Fermer la navigation"
            autoFocus
            className="grid size-9 cursor-pointer place-items-center text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>

      <nav aria-label="Navigation principale" className="pt-2">
        {quickNavigation.map((item) => (
          <NavigationRow item={item} key={item.label} onNavigate={onNavigate} />
        ))}
        <div aria-hidden="true" className="mx-4 my-3 border-t border-white/15" />
        {primaryNavigation.map((item) =>
          item.children ? (
            <NavigationGroup item={item} key={item.label} onNavigate={onNavigate} />
          ) : (
            <NavigationRow item={item} key={item.label} onNavigate={onNavigate} />
          ),
        )}
      </nav>

      <div className="mt-auto border-t border-white/15 py-2">
        <NavigationRow item={settingsNavigation} onNavigate={onNavigate} />
      </div>
    </>
  );
}

export function AppSidebar({
  isMobileOpen,
  onMobileClose,
}: {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const mobileNavigationId = useId();

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onMobileClose();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileOpen, onMobileClose]);

  return (
    <>
      <aside className="hidden h-svh w-56 shrink-0 flex-col bg-seno-700 lg:flex">
        <SidebarContent />
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fermer la navigation"
            className="absolute inset-0 cursor-pointer bg-slate-950/45"
            onClick={onMobileClose}
            type="button"
          />
          <aside
            aria-label="Navigation principale"
            className="relative flex h-[100dvh] w-72 max-w-[calc(100vw-2.5rem)] flex-col bg-seno-700 shadow-2xl"
            id={mobileNavigationId}
          >
            <SidebarContent
              onClose={onMobileClose}
              onNavigate={onMobileClose}
              showCloseButton
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
