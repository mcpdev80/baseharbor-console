import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)]/90 shadow-2xl shadow-black/10 ${className}`}>
      <header className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-[var(--muted)]">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
