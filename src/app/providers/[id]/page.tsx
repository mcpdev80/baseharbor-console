import Link from "next/link";
import { KeyRound, MoreHorizontal, RotateCcw, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { baseHarborData } from "@/lib/baseharbor/data";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { HealthBadge, OwnershipBadge } from "@/components/ui/badge";

export default async function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = await baseHarborData.provider(decodeURIComponent(id));
  if (!provider) notFound();

  const button="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-xs text-slate-300 outline-none hover:border-[var(--bh-signal-blue)]/35 focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]";

  return <div className="mx-auto max-w-[1450px] space-y-6">
    <div><Breadcrumbs items={[{label:"Providers",href:"/providers"},{label:provider.name}]} /><div className="flex items-start justify-between gap-6"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight text-white">{provider.name}</h1><HealthBadge value={provider.health} /><OwnershipBadge value={provider.ownership} /></div><p className="mt-2 text-xs text-slate-500">{provider.capability} · {provider.scope} · {provider.target}</p></div><div className="flex gap-2"><Link href="/security/rotate" className={button}><KeyRound className="size-3.5" /> Rotate</Link><button className={button}><RotateCcw className="size-3.5" /> Verify</button><button className={button} aria-label="More provider actions"><MoreHorizontal className="size-4" /></button></div></div></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5"><h2 className="text-sm font-semibold text-slate-100">Provider semantics</h2><dl className="mt-4 grid grid-cols-[160px_1fr] gap-x-4 gap-y-3 text-xs">{[["Capability",provider.capability],["Implementation",provider.implementation],["Scope",provider.scope],["Availability",provider.availability],["Target",provider.target],["Readiness",provider.readiness]].map(([l,v])=><div key={l} className="contents"><dt className="text-slate-600">{l}</dt><dd className="text-slate-300">{v}</dd></div>)}</dl></section>
      <section className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5"><h2 className="text-sm font-semibold text-slate-100">Security & lifecycle</h2><div className="mt-4 space-y-4"><div className="flex items-center gap-3 text-sm text-slate-300"><ShieldCheck className="size-4 text-emerald-400" />TLS {provider.tls ? "enabled" : "not managed"}</div><div><div className="text-[10px] uppercase tracking-[.12em] text-slate-600">Credential lifecycle</div><div className="mt-1 text-sm text-slate-200">{provider.credentialLifecycle}</div></div><div><div className="text-[10px] uppercase tracking-[.12em] text-slate-600">Applications</div><div className="mt-2 flex flex-wrap gap-2">{provider.applications.map((app)=><span key={app} className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-slate-400">{app}</span>)}</div></div></div></section>
    </div>
  </div>;
}
