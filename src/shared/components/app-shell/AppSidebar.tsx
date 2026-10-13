import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import logoUrl from "@/assets/logo.png";
import {
  primaryNavigation,
  quickNavigation,
  settingsNavigation,
  type NavigationItem,
} from "@/shared/config/navigation";
import { isNavigationPathActive } from "@/shared/lib/navigation-state";
import { cn } from "@/shared/lib/utils";

function NavigationRow({
  collapsed,
  item,
  onNavigate,
}: {
  collapsed: boolean;
  item: NavigationItem;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const Icon = item.icon;
  if (!item.path) return null;
  const active = isNavigationPathActive(pathname, item.path);
  const urgent = item.tone === "urgent";

  return (
    <Link
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 border-l-2 px-4 py-2.5 text-left text-sm transition-colors",
        urgent
          ? "gap-2.5 border px-3 py-2 font-semibold"
          : active
            ? "border-white bg-white/15 font-medium text-white"
            : "border-transparent text-white/60 hover:bg-white/8 hover:text-white",
        urgent &&
          (active
            ? "border-amber-400 bg-amber-400 text-[#00365A]"
            : "border-amber-400/25 bg-amber-400/15 text-amber-300 hover:border-amber-400 hover:bg-amber-400 hover:text-[#00365A]"),
        urgent && collapsed && "justify-center px-1",
      )}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      to={item.path}
    >
      <Icon
        aria-hidden="true"
        className={cn("shrink-0", urgent ? "size-3.5 fill-current" : "size-4")}
      />
      {!collapsed ? (
        <span
          className={cn(
            "flex-1 whitespace-nowrap",
            urgent && "text-xs tracking-wide uppercase",
          )}
        >
          {item.label}
        </span>
      ) : null}
    </Link>
  );
}

function NavigationGroup({
  collapsed,
  item,
  onNavigate,
}: {
  collapsed: boolean;
  item: NavigationItem;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const Icon = item.icon;
  const firstChild = item.children?.[0];
  if (!firstChild) return null;
  const active = item.children?.some((child) =>
    isNavigationPathActive(pathname, child.path),
  );

  return (
    <div>
      <Link
        aria-label={collapsed ? item.label : undefined}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 border-l-2 px-4 py-2.5 text-left text-sm transition-colors",
          active
            ? "border-white bg-white/15 font-medium text-white"
            : "border-transparent text-white/60 hover:bg-white/8 hover:text-white",
        )}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        to={firstChild.path}
      >
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        {!collapsed ? (
          <>
            <span className="flex-1 whitespace-nowrap">{item.label}</span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-[13px] shrink-0 transition-transform duration-200",
                active ? "text-white/70" : "-rotate-90 text-white/30",
              )}
            />
          </>
        ) : null}
      </Link>
      {active ? (
        <div
          className={
            collapsed ? "flex flex-col items-center gap-1 py-1" : "pb-1"
          }
        >
          {item.children?.map((child) => {
            const ChildIcon = child.icon;
            const childActive = isNavigationPathActive(pathname, child.path);
            return (
              <Link
                aria-current={childActive ? "page" : undefined}
                aria-label={collapsed ? child.label : undefined}
                className={cn(
                  collapsed
                    ? "size-1.5 rounded-full transition-colors"
                    : "flex w-full cursor-pointer items-center gap-2.5 border-l-2 py-2 pr-4 pl-10 text-left text-xs transition-colors",
                  collapsed
                    ? childActive
                      ? "bg-white"
                      : "bg-white/30 hover:bg-white/60"
                    : childActive
                      ? "border-white/60 bg-white/10 font-medium text-white"
                      : "border-transparent text-white/45 hover:bg-white/5 hover:text-white/80",
                )}
                key={child.path}
                onClick={onNavigate}
                title={collapsed ? child.label : undefined}
                to={child.path}
              >
                {!collapsed ? (
                  <>
                    <ChildIcon
                      aria-hidden="true"
                      className="size-[13px] shrink-0"
                    />
                    <span className="whitespace-nowrap">{child.label}</span>
                  </>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SidebarContent({
  collapsed = false,
  onClose,
  onNavigate,
}: {
  collapsed?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex min-h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4 py-5">
        <img
          alt={collapsed ? "SENO Rénovation" : ""}
          className="size-8 shrink-0 object-contain"
          src={logoUrl}
        />
        {!collapsed ? (
          <span className="flex-1 overflow-hidden text-sm font-semibold tracking-wide whitespace-nowrap">
            SENO Rénovation
          </span>
        ) : null}
        {onClose ? (
          <button
            aria-label="Fermer la navigation"
            autoFocus
            className="grid size-9 shrink-0 cursor-pointer place-items-center text-white/70 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>
      <nav
        aria-label="Navigation principale"
        className="min-h-0 flex-1 overflow-y-auto py-3"
      >
        {quickNavigation.map((item) =>
          item.tone === "urgent" ? (
            <div className="px-3 pb-3" key={item.label}>
              <NavigationRow
                collapsed={collapsed}
                item={item}
                onNavigate={onNavigate}
              />
            </div>
          ) : (
            <NavigationRow
              collapsed={collapsed}
              item={item}
              key={item.label}
              onNavigate={onNavigate}
            />
          ),
        )}
        <div
          aria-hidden="true"
          className="mx-4 my-2 border-t border-white/10"
        />
        {primaryNavigation.map((item) =>
          item.children ? (
            <NavigationGroup
              collapsed={collapsed}
              item={item}
              key={item.label}
              onNavigate={onNavigate}
            />
          ) : (
            <NavigationRow
              collapsed={collapsed}
              item={item}
              key={item.label}
              onNavigate={onNavigate}
            />
          ),
        )}
      </nav>
      <div className="shrink-0 border-t border-white/10">
        <NavigationRow
          collapsed={collapsed}
          item={settingsNavigation}
          onNavigate={onNavigate}
        />
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isMobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onMobileClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileOpen, onMobileClose]);

  return (
    <>
      <aside
        aria-label="Menu principal"
        className={cn(
          "relative hidden h-full shrink-0 flex-col bg-seno-700 text-white transition-[width] duration-200 lg:flex",
          collapsed ? "w-14" : "w-[220px]",
        )}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
          className="absolute top-16 -right-3 z-10 grid size-6 cursor-pointer place-items-center border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
          onClick={() => setCollapsed((value) => !value)}
          title={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
          type="button"
        >
          {collapsed ? (
            <ChevronRight aria-hidden="true" className="size-3 text-seno-700" />
          ) : (
            <ChevronLeft aria-hidden="true" className="size-3 text-seno-700" />
          )}
        </button>
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
            aria-label="Navigation mobile"
            className="relative flex h-dvh w-72 max-w-[calc(100vw-2.5rem)] flex-col bg-seno-700 text-white shadow-2xl"
            id={mobileNavigationId}
          >
            <SidebarContent
              onClose={onMobileClose}
              onNavigate={onMobileClose}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
