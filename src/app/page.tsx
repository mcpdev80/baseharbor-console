import Link from "next/link";
import { Activity, AppWindow, Boxes, PackageSearch, Target, TriangleAlert } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { RuntimeResourceTable } from "@/components/runtime/runtime-resource-table";
import { baseHarborData } from "@/lib/baseharbor/data";
import { platformFacts } from "@/lib/navigation";

export default async function OverviewPage() {
  const [summary, resources, executions] = await Promise.all([
    baseHarborData.summary(),
    baseHarborData.runtimeResources(),
    baseHarborData.executions(),
  ]);

  const cards = [
    { label: "Applications", value: summary.applications, icon: AppWindow, href: "/applications" },
    { label: "Targets", value: summary.targets, icon: Target, href: "/targets" },
    { label: "Providers", value: summary.providers, icon: PackageSearch, href: "/providers" },
    { label: "Runtime resources", value: summary.runtimeResources, icon: Boxes, href: "/runtime" },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.18em] text-[var(--bh-signal-blue)]">BaseHarbor Console</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Platform overview</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            One visual operations surface over the same BaseHarbor Core semantics used by CLI, JSON, MCP and the protected HTTP API.
          </p>
        </div>
        <Link href="/operations" className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs text-slate-400 hover:border-[var(--bh-signal-blue)]/35 hover:text-white">
          <Activity className="size-4 text-[var(--bh-signal-blue)]" />
          {executions.filter((execution) => execution.state === "running").length} running operation
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-[var(--border)] bg-[var(--panel)]/90 p-5 transition hover:border-[var(--bh-signal-blue)]/35 hover:bg-[var(--panel-2)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{label}</span>
              <Icon className="size-4 text-slate-600" />
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</div>
          </Link>
        ))}
        <div className="rounded-xl border border-[var(--bh-harbor-orange)]/25 bg-[var(--bh-harbor-orange)]/[.05] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-orange-200/80">Needs attention</span>
            <TriangleAlert className="size-4 text-[var(--bh-harbor-orange)]" />
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-orange-100">{summary.degraded}</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Panel
          title="Runtime resources"
          subtitle="Provider-neutral view. Docker today; Podman/Kubernetes/OpenShift use the same resource model."
          action={<Link href="/runtime" className="text-xs text-[var(--bh-signal-blue)] hover:text-white">Open Runtime →</Link>}
        >
          <RuntimeResourceTable resources={resources.slice(0, 5)} />
        </Panel>

        <Panel title="Core contract readiness" subtitle="Console dependencies frozen in BaseHarbor before v0.5.">
          <div className="divide-y divide-[var(--border)]">
            {platformFacts.map((fact) => (
              <div key={fact.label} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-xs text-slate-500">{fact.label}</span>
                <span className="text-xs font-medium text-slate-300">{fact.value}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--border)] bg-[var(--bh-signal-blue)]/[.035] px-5 py-4 text-xs leading-5 text-slate-400">
            The Console never talks directly to Docker, Podman, Kubernetes or a Node Connector. All operations flow through BaseHarbor Core.
          </div>
        </Panel>
      </div>
    </div>
  );
}
