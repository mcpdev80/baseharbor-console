import Link from "next/link";
import { Box, Cpu, MemoryStick } from "lucide-react";
import type { RuntimeResource } from "@/lib/baseharbor/types";
import { HealthBadge, OwnershipBadge } from "@/components/ui/badge";

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

export function RuntimeResourceTable({ resources }: { resources: RuntimeResource[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500">
          <tr>
            <th className="px-5 py-3 font-medium">Resource</th>
            <th className="px-4 py-3 font-medium">Runtime / Target</th>
            <th className="px-4 py-3 font-medium">Ownership</th>
            <th className="px-4 py-3 font-medium">State</th>
            <th className="px-4 py-3 font-medium">CPU</th>
            <th className="px-4 py-3 font-medium">Memory</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {resources.map((resource) => (
            <tr key={resource.id} className="group hover:bg-white/[.02]">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white/[.025] text-slate-400">
                    <Box className="size-4" />
                  </div>
                  <div>
                    <Link href={`/runtime/${encodeURIComponent(resource.id)}`} className="font-medium text-slate-200 hover:text-[var(--bh-signal-blue)]">{resource.displayName}</Link>
                    <div className="mt-0.5 text-xs text-slate-600">{resource.kind}{resource.image ? ` · ${resource.image}` : ""}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="text-slate-300">{resource.runtime}</div>
                <div className="text-xs text-slate-600">{resource.target}</div>
              </td>
              <td className="px-4 py-4"><OwnershipBadge value={resource.ownership} /></td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <HealthBadge value={resource.health} />
                  <span className="text-xs text-slate-500">{resource.observedState ?? "unknown"}</span>
                </div>
              </td>
              <td className="px-4 py-4 text-slate-400">
                <span className="inline-flex items-center gap-1.5"><Cpu className="size-3.5" />{resource.metrics?.cpuPercent?.toFixed(1) ?? "—"}%</span>
              </td>
              <td className="px-4 py-4 text-slate-400">
                <span className="inline-flex items-center gap-1.5"><MemoryStick className="size-3.5" />{bytes(resource.metrics?.memoryBytes)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
