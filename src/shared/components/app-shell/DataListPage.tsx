import type { ReactNode } from "react";

// Layout shared by Clients, Devis and Chantiers in the supplied Figma Make export.
export function DataListPage({
  children,
  title,
  toolbar,
}: {
  children: ReactNode;
  title: string;
  toolbar: ReactNode;
}) {
  return (
    <main
      aria-label={title}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
    >
      <div className="shrink-0 space-y-3 border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
        {toolbar}
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6">
        {children}
      </div>
    </main>
  );
}
