"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-rose-400/20 bg-rose-400/[.025] p-6" role="alert">
      <div className="flex items-start gap-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-300" />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-white">This Console view could not be loaded</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">The current view failed before BaseHarbor could provide a structured problem. Retry the view; persistent failures should be inspected through diagnostics and operation evidence.</p>
          {error.digest && <p className="mt-3 font-mono text-[10px] text-slate-600">digest {error.digest}</p>}
          <button onClick={reset} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-xs text-slate-200 outline-none hover:border-[var(--bh-signal-blue)]/35 focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]">
            <RotateCcw className="size-3.5" /> Retry
          </button>
        </div>
      </div>
    </div>
  );
}
