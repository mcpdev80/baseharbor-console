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
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-200">{label}</label>
        {provenance && <span className="text-[10px] uppercase tracking-[.1em] text-slate-600">{provenance}</span>}
      </div>
      {children}
      {error ? <p className="mt-1.5 text-xs text-rose-300" role="alert">{error}</p> : hint ? <p className="mt-1.5 text-xs leading-5 text-slate-600">{hint}</p> : null}
    </div>
  );
}
