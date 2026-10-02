import Link from "next/link";
import { ArrowLeft, GitBranch, Play, RotateCcw, ShieldCheck, Square, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { baseHarborData } from "@/lib/baseharbor/data";
import { HealthBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { RuntimeResourceTable } from "@/components/runtime/runtime-resource-table";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await baseHarborData.application(decodeURIComponent(id));
  if (!application) notFound();

  const [resources, target] = await Promise.all([
    baseHarborData.runtimeResources(),
    baseHarborData.target(application.target),
  ]);

  const appResources = resources.filter((resource) =>
    resource.relationships.some((relationship) => relationship.kind === "application" && relationship.id === application.id),
  );

  const button = "inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs text-slate-300 hover:border-[var(--bh-signal-blue)]/35";

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <Link href="/applications" className="mb-4 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white">
          <ArrowLeft className="size-3.5" /> Applications
        </Link>
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-white">{application.name}</h1>
              <HealthBadge value={application.health} />
              <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-slate-400">{application.environment}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>{application.target}</span>
              <span>·</span>
              <span>{application.deploymentId}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><GitBranch className="size-3" />{application.revision}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className={button}><Play className="size-3.5" /> Apply</button>
            <button className={button}><RotateCcw className="size-3.5" /> Repair</button>
            <button className={button}><Square className="size-3.5" /> Stop</button>
            <button className={button}><Trash2 className="size-3.5" /> Destroy</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Desired", application.desiredState],
          ["Observed", application.observedState],
          ["Readiness", application.readiness],
          ["Components", String(application.components)],
          ["Providers", String(application.providers)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-2 text-xl font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Source & deployment" subtitle="Source identity and effective deployment context from BaseHarbor.">
          <div className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
            {[
              ["Source", application.source],
              ["Revision", application.revision],
              ["Application ID", application.id],
              ["Deployment ID", application.deploymentId],
              ["Environment", application.environment],
              ["Target", application.target],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-[11px] uppercase tracking-[.12em] text-slate-600">{label}</div>
                <div className="mt-1 break-all text-sm text-slate-300">{value}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Effective target" subtitle="Runtime and access stay explicitly separate.">
          {target ? (
            <div className="space-y-4 p-5">
              <div>
                <div className="text-[11px] uppercase tracking-[.12em] text-slate-600">Runtime Provider</div>
                <div className="mt-1 text-sm text-slate-200">{target.runtimeProvider}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[.12em] text-slate-600">Target Access Provider</div>
                <div className="mt-1 text-sm text-slate-200">{target.accessProvider}</div>
                <div className="mt-1 font-mono text-xs text-slate-600">{target.accessReference}</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <ShieldCheck className="size-4" /> {target.health} / {target.readiness}
              </div>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-500">Target not found.</div>
          )}
        </Panel>
      </div>

      <Panel title="Runtime realization" subtitle="Resources related to this application through BaseHarbor-owned relationships.">
        {appResources.length > 0 ? (
          <RuntimeResourceTable resources={appResources} />
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">No runtime resources currently related to this application.</div>
        )}
      </Panel>

      <Panel title="Lifecycle" subtitle="All actions become BaseHarbor machine-operation executions with safety, policy and audit context.">
        <div className="grid gap-3 p-5 md:grid-cols-3">
          {[
            ["Plan", "Preview desired changes without mutation."],
            ["Doctor", "Inspect readiness, policy and dependency problems."],
            ["Evidence", "Review lifecycle, actor and verification evidence."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-lg border border-[var(--border)] bg-white/[.018] p-4">
              <div className="text-sm font-medium text-slate-200">{title}</div>
              <div className="mt-2 text-xs leading-5 text-slate-500">{description}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
