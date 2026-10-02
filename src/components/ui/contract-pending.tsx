import { CircleDashed, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";

export function ContractPending({
  issue,
  title,
  description,
  children,
}: {
  issue: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-amber-400/20 bg-amber-400/[.025] p-4">
      <div className="flex items-start gap-3">
        <CircleDashed className="mt-0.5 size-4 shrink-0 text-amber-300" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-200">{title}</div>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          <div className="mt-2 font-mono text-[10px] text-slate-700">{issue}</div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ContractPendingButton({
  children,
  issue,
  className = "",
}: {
  children: ReactNode;
  issue: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled
      title={`Requires BaseHarbor ${issue}`}
      className={`inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-xs text-slate-500 opacity-60 ${className}`}
    >
      <LockKeyhole className="size-3.5" />
      {children}
    </button>
  );
}
