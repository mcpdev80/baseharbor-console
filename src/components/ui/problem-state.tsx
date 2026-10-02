import { AlertTriangle, RotateCcw } from "lucide-react";
import type { BaseHarborProblem } from "@/lib/baseharbor/types";

export function ProblemState({ problem }: { problem: BaseHarborProblem }) {
  return (
    <div role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/[.025] p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-300" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-100">{problem.message}</div>
          <div className="mt-1 font-mono text-[10px] text-slate-600">{problem.code}{problem.resource ? ` · ${problem.resource}` : ""}</div>
          {problem.next && <div className="mt-3 text-xs leading-5 text-slate-400">{problem.next}</div>}
          {problem.retryable && <button className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-xs text-slate-300"><RotateCcw className="size-3.5" /> Retry</button>}
        </div>
      </div>
    </div>
  );
}
