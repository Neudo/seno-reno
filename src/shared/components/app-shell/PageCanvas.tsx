import type { ReactNode } from "react";

type PageCanvasProps = {
  children?: ReactNode;
  title: string;
};

export function PageCanvas({ children, title }: PageCanvasProps) {
  return (
    <main className="min-w-0 flex-1 overflow-auto bg-[#f7f8f9] p-5 sm:p-7">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">
          {title}
        </h1>
        {children}
      </div>
    </main>
  );
}
