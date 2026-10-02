import Link from "next/link";
import type { TargetSummary } from "@/lib/baseharbor/types";
import { HealthBadge } from "@/components/ui/badge";
import { Cable, Cpu, ShieldCheck } from "lucide-react";

export function TargetTable({ targets }: { targets: TargetSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500">
          <tr>
            <th className="px-5 py-3 font-medium">Target</th>
            <th className="px-4 py-3 font-medium">Runtime Provider</th>
            <th className="px-4 py-3 font-medium">Target Access</th>
            <th className="px-4 py-3 font-medium">Health</th>
            <th className="px-4 py-3 font-medium">Capabilities</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {targets.map((target) => (
            <tr key={target.id} className="hover:bg-white/[.02]">
              <td className="px-5 py-4">
                <div className="flex items-center gap-2 font-medium text-white">
                  <Link href={`/targets/${encodeURIComponent(target.id)}`} className="hover:text-[var(--bh-signal-blue)]">{target.name}</Link>
                  {target.isDefault && <span className="rounded-full border border-[var(--bh-signal-blue)]/20 bg-[var(--bh-signal-blue)]/10 px-2 py-0.5 text-[10px] text-sky-200">default</span>}
                </div>
                <div className="mt-1 text-xs text-slate-600">{target.environment} · {target.scope}</div>
              </td>
              <td className="px-4 py-4">
                <div className="inline-flex items-center gap-2 text-slate-300"><Cpu className="size-4 text-slate-500" />{target.runtimeProvider}</div>
              </td>
              <td className="px-4 py-4">
                <div className="inline-flex items-center gap-2 text-slate-300"><Cable className="size-4 text-slate-500" />{target.accessProvider}</div>
                <div className="mt-1 text-xs text-slate-600">{target.accessReference}</div>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2"><HealthBadge value={target.health} /><ShieldCheck className="size-3.5 text-emerald-400/70" /></div>
              </td>
              <td className="px-4 py-4">
                <div className="flex max-w-xl flex-wrap gap-1.5">
                  {target.capabilities.map((cap) => <span key={cap} className="rounded border border-[var(--border)] bg-white/[.02] px-2 py-1 text-[10px] text-slate-400">{cap}</span>)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
