import Link from "next/link";
import { Database, ShieldCheck } from "lucide-react";
import type { ProviderSummary } from "@/lib/baseharbor/types";
import { HealthBadge, OwnershipBadge } from "@/components/ui/badge";

export function ProviderTable({ providers }: { providers: ProviderSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500">
          <tr><th className="px-5 py-3">Provider</th><th className="px-4 py-3">Capability</th><th className="px-4 py-3">Scope</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Availability</th><th className="px-4 py-3">Health</th></tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {providers.map((provider) => (
            <tr key={provider.id} className="hover:bg-white/[.02]">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md border border-[var(--border)] bg-white/[.02]"><Database className="size-4 text-slate-500" /></div>
                  <div>
                    <Link href={`/providers/${encodeURIComponent(provider.id)}`} className="font-medium text-slate-200 hover:text-[var(--bh-signal-blue)]">{provider.name}</Link>
                    <div className="mt-1 text-xs text-slate-600">{provider.implementation}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-xs text-slate-400">{provider.capability}</td>
              <td className="px-4 py-4"><OwnershipBadge value={provider.ownership} /><div className="mt-1 text-[10px] text-slate-600">{provider.scope}</div></td>
              <td className="px-4 py-4 text-xs text-slate-400">{provider.target}</td>
              <td className="px-4 py-4 text-xs text-slate-400">{provider.availability}</td>
              <td className="px-4 py-4"><div className="flex items-center gap-2"><HealthBadge value={provider.health} />{provider.tls && <ShieldCheck className="size-3.5 text-emerald-400/70" />}</div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
