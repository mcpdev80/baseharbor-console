import { GitBranch, MoreHorizontal, Play, RotateCcw, Square } from "lucide-react";
import { notFound } from "next/navigation";
import { baseHarborData } from "@/lib/baseharbor/data";
import { HealthBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { RuntimeResourceTable } from "@/components/runtime/runtime-resource-table";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ResourceTabs } from "@/components/ui/resource-tabs";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await baseHarborData.application(decodeURIComponent(id));
  if (!application) notFound();

  const [resources, target, executions] = await Promise.all([
    baseHarborData.runtimeResources(),
    baseHarborData.target(application.target),
    baseHarborData.executions(),
  ]);

  const appResources = resources.filter((resource) =>
    resource.relationships.some((relationship) => relationship.kind === "application" && relationship.id === application.id),
  );
  const appExecutions = executions.filter((execution) => execution.resource.includes(application.name));

  const button = "inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-xs text-slate-300 outline-none hover:border-[var(--bh-signal-blue)]/35 focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]";

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <Breadcrumbs items={[{ label: "Applications", href: "/applications" }, { label: application.name }]} />
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-white">{application.name}</h1>
              <HealthBadge value={application.health} />
              <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-slate-400">{application.readiness}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{application.environment}</span><span>·</span>
              <span>{application.target}</span><span>·</span>
              <span>{application.deploymentId}</span><span>·</span>
              <span className="inline-flex items-center gap-1"><GitBranch className="size-3" />{application.revision}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className={button}><Play className="size-3.5" /> Apply</button>
            <button className={button}><RotateCcw className="size-3.5" /> Repair</button>
            <button className={button}><Square className="size-3.5" /> Stop</button>
            <button className={button} aria-label="More application actions"><MoreHorizontal className="size-4" /></button>
          </div>
        </div>
      </div>

      <ResourceTabs
        ariaLabel="Application views"
        tabs={[
          { label: "Overview", href: `/applications/${encodeURIComponent(application.id)}`, active: true },
          { label: "Runtime", href: "#runtime" },
          { label: "Providers", href: "#providers", disabled: true },
          { label: "Observability", href: "#observability", disabled: true },
          { label: "Operations", href: "#operations" },
          { label: "Evidence", href: "#evidence", disabled: true },
        ]}
      />

      <section aria-labelledby="application-state">
        <h2 id="application-state" className="mb-2 text-sm font-semibold text-slate-200">State</h2>
        <div className="grid gap-x-8 gap-y-4 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Desired", application.desiredState],
            ["Observed", application.observedState],
            ["Readiness", application.readiness],
            ["Updated", new Date(application.updatedAt).toLocaleString("en-GB")],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-[11px] uppercase tracking-[.12em] text-slate-600">{label}</div>
              <div className="mt-1 text-sm font-medium text-slate-200">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Source & deployment" subtitle="Authoritative BaseHarbor context.">
          <div className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
            {[
              ["Source", application.source],
              ["Revision", application.revision],
              ["Application ID", application.id],
              ["Deployment ID", application.deploymentId],
              ["Components", String(application.components)],
              ["Providers", String(application.providers)],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-[11px] uppercase tracking-[.12em] text-slate-600">{label}</div>
                <div className="mt-1 break-all text-sm text-slate-300">{value}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Effective target" subtitle="Runtime and access are separate contracts.">
          {target ? (
            <div className="grid gap-4 p-5">
              {[
                ["Runtime Provider", target.runtimeProvider],
                ["Target Access Provider", target.accessProvider],
                ["Access Reference", target.accessReference],
                ["Scope", target.scope],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[11px] uppercase tracking-[.12em] text-slate-600">{label}</div>
                  <div className="mt-1 text-sm text-slate-200">{value}</div>
                </div>
              ))}
            </div>
          ) : <div className="p-5 text-sm text-slate-500">Target not found.</div>}
        </Panel>
      </div>

      <section id="runtime" aria-labelledby="runtime-heading">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="runtime-heading" className="text-sm font-semibold text-slate-200">Runtime realization</h2>
          <span className="text-xs text-slate-600">{appResources.length} related resources</span>
        </div>
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">
          {appResources.length > 0 ? <RuntimeResourceTable resources={appResources} /> : <div className="p-8 text-center text-sm text-slate-500">No runtime resources related to this application.</div>}
        </div>
      </section>

      <section id="operations" aria-labelledby="operations-heading">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="operations-heading" className="text-sm font-semibold text-slate-200">Recent operations</h2>
          <span className="text-xs text-slate-600">{appExecutions.length} recent</span>
        </div>
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">
          {appExecutions.length > 0 ? appExecutions.map((execution) => (
            <div key={execution.executionId} className="flex items-center gap-4 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="text-sm text-slate-200">{execution.operationId}</div>
                <div className="mt-1 text-xs text-slate-600">{execution.message}</div>
              </div>
              <span className="text-xs text-slate-500">{execution.state}</span>
              <span className="font-mono text-[10px] text-slate-700">{execution.executionId}</span>
            </div>
          )) : <div className="p-6 text-center text-sm text-slate-500">No recent operations for this application.</div>}
        </div>
      </section>
    </div>
  );
}
