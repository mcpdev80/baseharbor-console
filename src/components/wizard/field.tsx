import type { ReactNode } from "react";

export function WizardField({
  label,
  hint,
  provenance,
  error,
  children,
}: {
  label: string;
  hint?: string;
  provenance?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        {provenance && <span className="text-[10px] uppercase tracking-[.1em] text-slate-600">{provenance}</span>}
      </span>
      {children}
      {error ? <span className="mt-1.5 block text-xs text-rose-300" role="alert">{error}</span> : hint ? <span className="mt-1.5 block text-xs leading-5 text-slate-600">{hint}</span> : null}
    </label>
  );
}
