import Link from "next/link";
import { ArrowLeft, Box, Link2, ScrollText, TerminalSquare } from "lucide-react";
import { notFound } from "next/navigation";
import { baseHarborData } from "@/lib/baseharbor/data";
import { HealthBadge, OwnershipBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { ResourceActions } from "@/components/runtime/resource-actions";
import { ResourceMetrics } from "@/components/runtime/resource-metrics";

export default async function RuntimeResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await baseHarborData.runtimeResource(decodeURIComponent(id));
  if (!resource) notFound();

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <Link href="/runtime" className="mb-4 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white">
          <ArrowLeft className="size-3.5" /> Runtime
        </Link>
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] text-slate-400">
              <Box className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-white">{resource.displayName}</h1>
                <OwnershipBadge value={resource.ownership} />
                <HealthBadge value={resource.health} />
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{resource.runtime} · {resource.target} · {resource.kind}</p>
              {resource.nativeName && <p className="mt-1 font-mono text-xs text-slate-600">{resource.nativeName}</p>}
            </div>
          </div>
          <ResourceActions resource={resource} />
        </div>
      </div>

      <ResourceMetrics resource={resource} />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Resource state" subtitle="BaseHarbor desired/observed state and runtime projection.">
          <div className="grid gap-x-8 gap-y-4 p-5 sm:grid-cols-2">
            {[
              ["Desired state", resource.desiredState ?? "—"],
              ["Observed state", resource.observedState ?? "—"],
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

        <Panel title="Relationships" subtitle="Authoritative BaseHarbor ownership and topology links.">
          <div className="divide-y divide-[var(--border)]">
            {resource.relationships.map((relationship) => (
              <div key={`${relationship.kind}-${relationship.id}`} className="flex items-center gap-3 px-5 py-3.5">
                <Link2 className="size-3.5 text-slate-600" />
                <div className="flex-1">
                  <div className="text-xs text-slate-300">{relationship.name ?? relationship.id}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-[.12em] text-slate-600">{relationship.kind}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Logs" subtitle="Will bind to the protected BaseHarbor log stream from #767.">
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
            <ScrollText className="size-6 text-slate-600" />
            <div className="text-sm text-slate-300">Log stream surface prepared</div>
            <div className="max-w-md text-xs leading-5 text-slate-600">The browser will open a BaseHarbor-authenticated stream. It will never connect directly to Docker, Podman or the Node Connector.</div>
          </div>
        </Panel>

        <Panel title="Terminal" subtitle="Explicit capability, policy and authorization checked before session creation.">
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
            <TerminalSquare className="size-6 text-slate-600" />
            <div className="text-sm text-slate-300">{resource.capabilities?.includes("terminal") ? "Terminal capability available" : "Terminal capability unavailable"}</div>
            <div className="max-w-md text-xs leading-5 text-slate-600">xterm integration will attach only to an authorized BaseHarbor exec session, never a generic host shell.</div>
          </div>
        </Panel>
      </div>

      {resource.runtimeDetails && (
        <Panel title="Runtime details" subtitle="Provider/runtime-specific extension data; not portable Application Intent.">
          <pre className="overflow-x-auto p-5 text-xs leading-6 text-slate-400">{JSON.stringify(resource.runtimeDetails, null, 2)}</pre>
        </Panel>
      )}
    </div>
  );
}
