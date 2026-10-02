import { CheckCircle2, CircleEllipsis, Clock3, ShieldAlert, XCircle } from "lucide-react";
import type { OperationExecution } from "@/lib/baseharbor/types";

function StateIcon({ state }: { state: OperationExecution["state"] }) {
  if (state === "succeeded") return <CheckCircle2 className="size-4 text-emerald-400" />;
  if (state === "failed" || state === "cancelled") return <XCircle className="size-4 text-rose-400" />;
  if (state === "running") return <CircleEllipsis className="size-4 text-[var(--bh-signal-blue)]" />;
  return <Clock3 className="size-4 text-slate-500" />;
}

export function ExecutionList({ executions }: { executions: OperationExecution[] }) {
  return (
    <div className="divide-y divide-[var(--border)]">
      {executions.map((execution) => (
        <div key={execution.executionId} className="px-5 py-4">
          <div className="flex items-start gap-3">
            <StateIcon state={execution.state} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-200">{execution.operationId}</span>
                <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-slate-500">{execution.state}</span>
                {execution.safety !== "read_only" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/[.06] px-2 py-0.5 text-[10px] text-amber-300">
                    <ShieldAlert className="size-3" /> {execution.safety}
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-slate-500">{execution.resource} · {execution.actor}</div>
              {execution.message && <div className="mt-2 text-xs text-slate-400">{execution.message}</div>}
              {execution.progress != null && execution.state === "running" && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.04]">
                  <div className="h-full rounded-full bg-[var(--bh-signal-blue)]" style={{ width: `${Math.max(0, Math.min(100, execution.progress))}%` }} />
                </div>
              )}
            </div>
            <div className="font-mono text-[10px] text-slate-600">{execution.executionId}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
