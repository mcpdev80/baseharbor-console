import { Box } from "lucide-react";
import { notFound } from "next/navigation";
import { baseHarborData } from "@/lib/baseharbor/data";
import { HealthBadge, OwnershipBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { ResourceActions } from "@/components/runtime/resource-actions";
import { ResourceMetrics } from "@/components/runtime/resource-metrics";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ResourceTabs } from "@/components/ui/resource-tabs";

export default async function RuntimeResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await baseHarborData.runtimeResource(decodeURIComponent(id));
  if (!resource) notFound();

  const appRelationship = resource.relationships.find((relationship) => relationship.kind === "application");

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <Breadcrumbs items={[
          ...(appRelationship ? [{ label: "Applications", href: "/applications" }, { label: appRelationship.name ?? appRelationship.id, href: `/applications/${encodeURIComponent(appRelationship.id)}` }] : []),
          { label: "Runtime", href: "/runtime" },
          { label: resource.displayName },
        ]} />

        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel)] text-slate-500">
              <Box className="size-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-white">{resource.displayName}</h1>
                <OwnershipBadge value={resource.ownership} />
                <HealthBadge value={resource.health} />
                <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-slate-400">{resource.readiness}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{resource.kind} · {resource.runtime} / {resource.target}</p>
              {resource.nativeName && <p className="mt-1 font-mono text-[11px] text-slate-700">{resource.nativeName}</p>}
            </div>
          </div>
          <ResourceActions resource={resource} />
        </div>
      </div>

      <ResourceTabs
        ariaLabel="Runtime resource views"
        tabs={[
          { label: "Overview", href: `/runtime/${encodeURIComponent(resource.id)}`, active: true },
          { label: "Logs", href: "#logs" },
          { label: "Metrics", href: "#metrics" },
          { label: "Events", href: "#events", disabled: true },
          { label: "Inspect", href: "#inspect" },
          { label: "Terminal", href: "#terminal" },
        ]}
      />

      <section id="metrics" aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">Metrics</h2>
        <ResourceMetrics resource={resource} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="State" subtitle="BaseHarbor desired and observed state.">
          <div className="grid gap-x-8 gap-y-4 p-5 sm:grid-cols-2">
            {[
              ["Desired", resource.desiredState ?? "—"],
              ["Observed", resource.observedState ?? "—"],
              ["Readiness", resource.readiness ?? "unknown"],
              ["Image", resource.image ?? "—"],
              ["Runtime", resource.runtime],
              ["Target", resource.target],
              ["Created", resource.createdAt ? new Date(resource.createdAt).toLocaleString("en-GB") : "—"],
              ["Resource ID", resource.id],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-[11px] uppercase tracking-[.12em] text-slate-600">{label}</div>
                <div className="mt-1 break-all text-sm text-slate-300">{value}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Relationships" subtitle="Authoritative BaseHarbor topology.">
          <div className="divide-y divide-[var(--border)]">
            {resource.relationships.map((relationship) => (
              <div key={`${relationship.kind}-${relationship.id}`} className="px-5 py-3.5">
                <div className="text-xs text-slate-300">{relationship.name ?? relationship.id}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-[.12em] text-slate-600">{relationship.kind}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <section id="logs" aria-labelledby="logs-heading" className="rounded-lg border border-[var(--border)] bg-[var(--panel)]">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 id="logs-heading" className="text-sm font-semibold text-slate-100">Logs</h2>
          <p className="mt-1 text-xs text-slate-500">Protected BaseHarbor stream; never direct browser-to-runtime.</p>
        </div>
        <pre className="min-h-56 overflow-auto p-5 text-xs leading-6 text-slate-500">Waiting for live BaseHarbor log stream (#767)…</pre>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section id="inspect" aria-labelledby="inspect-heading" className="rounded-lg border border-[var(--border)] bg-[var(--panel)]">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 id="inspect-heading" className="text-sm font-semibold text-slate-100">Inspect</h2>
            <p className="mt-1 text-xs text-slate-500">Runtime-specific extension data, secondary to BaseHarbor identity.</p>
          </div>
          <pre className="min-h-56 overflow-auto p-5 text-xs leading-6 text-slate-500">{JSON.stringify(resource.runtimeDetails ?? {}, null, 2)}</pre>
        </section>

        <section id="terminal" aria-labelledby="terminal-heading" className="rounded-lg border border-[var(--border)] bg-[var(--panel)]">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 id="terminal-heading" className="text-sm font-semibold text-slate-100">Terminal</h2>
            <p className="mt-1 text-xs text-slate-500">Explicit policy-controlled runtime capability.</p>
          </div>
          <div className="flex min-h-56 items-center justify-center p-6 text-center text-sm text-slate-500">
            {resource.capabilities?.includes("terminal") ? "Terminal capability available; session binding waits for #767/#770." : "Terminal capability unavailable for this resource."}
          </div>
        </section>
      </div>
    </div>
  );
}
