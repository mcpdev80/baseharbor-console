import Link from "next/link";
import { MoreHorizontal, RefreshCw, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { baseHarborData } from "@/lib/baseharbor/data";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ResourceTabs } from "@/components/ui/resource-tabs";
import { HealthBadge } from "@/components/ui/badge";
import { RuntimeResourceTable } from "@/components/runtime/runtime-resource-table";

export default async function TargetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const target = await baseHarborData.target(decodeURIComponent(id));
  if (!target) notFound();

  const [resources, applications] = await Promise.all([
    baseHarborData.runtimeResources(target.name),
    baseHarborData.applications(),
  ]);
  const targetApplications = applications.filter((application) => application.target === target.name);
  const button = "inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-xs text-slate-300 outline-none hover:border-[var(--bh-signal-blue)]/35 focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]";

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <Breadcrumbs items={[{ label: "Targets", href: "/targets" }, { label: target.name }]} />
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-white">{target.name}</h1>
              <HealthBadge value={target.health} />
              {target.isDefault && <span className="rounded-full border border-[var(--bh-signal-blue)]/20 bg-[var(--bh-signal-blue)]/10 px-2 py-0.5 text-[10px] text-sky-200">default</span>}
            </div>
            <p className="mt-2 text-xs text-slate-500">{target.environment} · {target.scope} · {target.readiness}</p>
          </div>
          <div className="flex gap-2">
            <button className={button}><RefreshCw className="size-3.5" /> Validate</button>
            <button className={button} aria-label="More target actions"><MoreHorizontal className="size-4" /></button>
          </div>
        </div>
      </div>

      <ResourceTabs
        ariaLabel="Target views"
        tabs={[
          { label: "Overview", href: `/targets/${encodeURIComponent(target.id)}`, active: true },
          { label: "Applications", href: "#applications" },
          { label: "Runtime", href: "#runtime" },
          { label: "Operations", href: "#operations", disabled: true },
          { label: "Evidence", href: "#evidence", disabled: true },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="runtime-provider-heading" className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 id="runtime-provider-heading" className="text-sm font-semibold text-slate-100">Runtime Provider</h2>
          <div className="mt-4 text-xl font-semibold text-white">{target.runtimeProvider}</div>
          <p className="mt-2 text-xs leading-5 text-slate-500">Owns runtime realization semantics, not transport/access.</p>
        </section>
        <section aria-labelledby="access-provider-heading" className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 id="access-provider-heading" className="text-sm font-semibold text-slate-100">Target Access Provider</h2>
          <div className="mt-4 text-xl font-semibold text-white">{target.accessProvider}</div>
          <p className="mt-1 font-mono text-xs text-slate-600">{target.accessReference}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">Bounded authenticated access path; independent from runtime semantics.</p>
        </section>
      </div>

      <section aria-labelledby="target-state-heading">
        <h2 id="target-state-heading" className="mb-2 text-sm font-semibold text-slate-200">State & capabilities</h2>
        <div className="grid gap-6 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5 lg:grid-cols-[300px_1fr]">
          <div className="grid gap-4">
            {[
              ["Environment", target.environment],
              ["Scope", target.scope],
              ["Endpoint", target.endpoint ?? "—"],
              ["Readiness", target.readiness],
            ].map(([label,value]) => <div key={label}><div className="text-[10px] uppercase tracking-[.12em] text-slate-600">{label}</div><div className="mt-1 text-sm text-slate-200">{value}</div></div>)}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[.12em] text-slate-600">Negotiated capabilities</div>
            <div className="mt-3 flex flex-wrap gap-2">{target.capabilities.map((capability) => <span key={capability} className="rounded-md border border-[var(--border)] bg-white/[.018] px-2.5 py-1.5 text-xs text-slate-400">{capability}</span>)}</div>
            <div className="mt-5 flex items-center gap-2 text-xs text-emerald-300"><ShieldCheck className="size-4" />Access security and capability negotiation verified</div>
          </div>
        </div>
      </section>

      <section id="applications" aria-labelledby="target-applications-heading">
        <div className="mb-2 flex items-center justify-between"><h2 id="target-applications-heading" className="text-sm font-semibold text-slate-200">Applications</h2><span className="text-xs text-slate-600">{targetApplications.length}</span></div>
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">
          {targetApplications.length ? targetApplications.map((application) => (
            <Link key={application.id} href={`/applications/${encodeURIComponent(application.id)}`} className="flex items-center gap-4 border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-white/[.02]">
              <div className="min-w-0 flex-1"><div className="text-sm text-slate-200">{application.name}</div><div className="mt-1 text-xs text-slate-600">{application.environment} · {application.deploymentId}</div></div>
              <HealthBadge value={application.health} />
            </Link>
          )) : <div className="p-8 text-center text-sm text-slate-500">No applications currently use this target.</div>}
        </div>
      </section>

      <section id="runtime" aria-labelledby="target-runtime-heading">
        <div className="mb-2 flex items-center justify-between"><h2 id="target-runtime-heading" className="text-sm font-semibold text-slate-200">Runtime resources</h2><span className="text-xs text-slate-600">{resources.length}</span></div>
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">
          {resources.length ? <RuntimeResourceTable resources={resources} /> : <div className="p-8 text-center text-sm text-slate-500">No runtime resources observed on this target.</div>}
        </div>
      </section>
    </div>
  );
}
