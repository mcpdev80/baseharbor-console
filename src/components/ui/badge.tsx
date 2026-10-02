import { AlertTriangle, CheckCircle2, CircleHelp, XCircle } from "lucide-react";
import type { OwnershipClass } from "@/lib/baseharbor/types";

const ownershipStyle: Record<OwnershipClass, string> = {
  managed: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  platform: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  external: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  unmanaged: "border-slate-500/30 bg-slate-500/10 text-slate-400",
};

export function OwnershipBadge({ value }: { value: OwnershipClass }) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${ownershipStyle[value]}`}>{value}</span>;
}

export function HealthBadge({ value }: { value?: string }) {
  const state = value ?? "unknown";
  if (state === "healthy" || state === "ready") {
    return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-300"><CheckCircle2 className="size-3" aria-hidden="true" />{state}</span>;
  }
  if (state === "degraded" || state === "not_ready") {
    return <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-300"><AlertTriangle className="size-3" aria-hidden="true" />{state}</span>;
  }
  if (state === "unhealthy" || state === "failed") {
    return <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 text-[11px] text-rose-300"><XCircle className="size-3" aria-hidden="true" />{state}</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-[11px] text-slate-400"><CircleHelp className="size-3" aria-hidden="true" />{state}</span>;
}
