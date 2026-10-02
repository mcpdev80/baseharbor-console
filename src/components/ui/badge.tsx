import type { OwnershipClass } from "@/lib/baseharbor/types";

const ownershipStyle: Record<OwnershipClass, string> = {
  managed: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  platform: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  external: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  unmanaged: "border-slate-500/30 bg-slate-500/10 text-slate-400",
};

export function OwnershipBadge({ value }: { value: OwnershipClass }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${ownershipStyle[value]}`}>
      {value}
    </span>
  );
}

export function HealthBadge({ value }: { value?: string }) {
  const style =
    value === "healthy" || value === "ready"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : value === "degraded"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : "border-slate-500/30 bg-slate-500/10 text-slate-400";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${style}`}>{value ?? "unknown"}</span>;
}
