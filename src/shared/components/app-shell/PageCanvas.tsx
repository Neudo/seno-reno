import type { ReactNode } from "react";

type PageCanvasProps = {
  children?: ReactNode;
  title: string;
};

export function PageCanvas({ children, title }: PageCanvasProps) {
  return (
    <main className="relative min-w-0 flex-1 overflow-auto bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-screen-xl">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {children}
      </div>
    </main>
  );
}
