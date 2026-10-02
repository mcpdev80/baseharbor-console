import { Activity, ArrowDownToLine, ArrowUpFromLine, Cpu, MemoryStick } from "lucide-react";
import type { RuntimeResource } from "@/lib/baseharbor/types";

function bytes(value?: number) {
  if (value == null) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = value;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

export function ResourceMetrics({ resource }: { resource: RuntimeResource }) {
  const metrics = [
    { label: "CPU", value: resource.metrics?.cpuPercent == null ? "—" : `${resource.metrics.cpuPercent.toFixed(1)}%`, icon: Cpu },
    { label: "Memory", value: bytes(resource.metrics?.memoryBytes), icon: MemoryStick },
    { label: "Network RX", value: bytes(resource.metrics?.networkRxBytes), icon: ArrowDownToLine },
    { label: "Network TX", value: bytes(resource.metrics?.networkTxBytes), icon: ArrowUpFromLine },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-lg border border-[var(--border)] bg-white/[.018] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{label}</span><Icon className="size-3.5" />
          </div>
          <div className="mt-2 text-xl font-semibold text-white">{value}</div>
        </div>
      ))}
      {resource.metrics == null && <Activity className="hidden" />}
    </div>
  );
}
