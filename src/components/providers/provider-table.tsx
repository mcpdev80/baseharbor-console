import Link from "next/link";
import { Database, ShieldCheck } from "lucide-react";
import type { ProviderSummary } from "@/lib/baseharbor/types";
import { HealthBadge, OwnershipBadge } from "@/components/ui/badge";

export function ProviderTable({ providers }: { providers: ProviderSummary[] }) {
  return <>
    <div className="divide-y divide-[var(--border)] md:hidden">
      {providers.map((provider)=><Link key={provider.id} href={`/providers/${encodeURIComponent(provider.id)}`} className="block px-4 py-4 hover:bg-white/[.02]">
        <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><Database className="mt-0.5 size-4 text-slate-500" /><div><div className="font-medium text-slate-200">{provider.name}</div><div className="mt-1 text-xs text-slate-600">{provider.capability} · {provider.scope} · {provider.target}</div></div></div><HealthBadge value={provider.health} /></div>
        <div className="mt-3 flex flex-wrap items-center gap-2"><OwnershipBadge value={provider.ownership} /><span className="text-xs text-slate-500">{provider.availability}</span>{provider.tls&&<span className="inline-flex items-center gap-1 text-xs text-emerald-300"><ShieldCheck className="size-3.5" />TLS</span>}</div>
      </Link>)}
    </div>
    <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-3">Provider</th><th className="px-4 py-3">Capability</th><th className="px-4 py-3">Scope</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Availability</th><th className="px-4 py-3">Health</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{providers.map((provider)=><tr key={provider.id} className="hover:bg-white/[.02]"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-md border border-[var(--border)] bg-white/[.02]"><Database className="size-4 text-slate-500" /></div><div><Link href={`/providers/${encodeURIComponent(provider.id)}`} className="font-medium text-slate-200 hover:text-[var(--bh-signal-blue)]">{provider.name}</Link><div className="mt-1 text-xs text-slate-600">{provider.implementation}</div></div></div></td><td className="px-4 py-4 text-xs text-slate-400">{provider.capability}</td><td className="px-4 py-4"><OwnershipBadge value={provider.ownership} /><div className="mt-1 text-[10px] text-slate-600">{provider.scope}</div></td><td className="px-4 py-4 text-xs text-slate-400">{provider.target}</td><td className="px-4 py-4 text-xs text-slate-400">{provider.availability}</td><td className="px-4 py-4"><div className="flex items-center gap-2"><HealthBadge value={provider.health} />{provider.tls&&<ShieldCheck className="size-3.5 text-emerald-400/70" />}</div></td></tr>)}</tbody></table></div>
  </>;
}
