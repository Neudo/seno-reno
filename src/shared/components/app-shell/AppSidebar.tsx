import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import {
  primaryNavigation,
  settingsNavigation,
  type NavigationItem,
} from "@/shared/config/navigation";
import { cn } from "@/shared/lib/utils";

function NavigationRow({ item }: { item: NavigationItem }) {
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
    isCurrent
      ? "border-white bg-white/15 text-white"
      : "border-transparent text-white/60 hover:bg-white/8 hover:text-white",
  );

  if (item.path) {
    return (
      <Link aria-current={isCurrent ? "page" : undefined} className={className} to={item.path}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

function NavigationGroup({ item }: { item: NavigationItem }) {
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

export function AppSidebar() {
  return (
    <aside className="hidden h-svh w-56 shrink-0 flex-col bg-seno-700 lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-white/15 px-4 text-white">
        <span className="grid size-8 place-items-center bg-white text-[11px] font-bold text-seno-700">
          SR
        </span>
        <span className="text-sm font-medium">SENO Rénovation</span>
      </div>

      <nav aria-label="Navigation principale" className="pt-2">
        {primaryNavigation.map((item) =>
          item.children ? (
            <NavigationGroup item={item} key={item.label} />
          ) : (
            <NavigationRow item={item} key={item.label} />
          ),
        )}
      </nav>

      <div className="mt-auto border-t border-white/15 py-2">
        <NavigationRow item={settingsNavigation} />
      </div>
    </aside>
  );
}
