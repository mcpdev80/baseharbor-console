import Link from "next/link";
import { Activity, ArrowRight, CircleAlert, Server, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { HealthBadge } from "@/components/ui/badge";
import { previewData } from "@/lib/baseharbor/data";

export default async function OverviewPage() {
  const [summary, applications, targets, executions] = await Promise.all([
    previewData.summary(),
    previewData.applications(),
    previewData.targets(),
    previewData.executions(),
  ]);

  const attention = applications.filter((app) => app.health === "degraded" || app.health === "unhealthy");
  const running = executions.filter((execution) => execution.state === "running");

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Overview</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">BaseHarbor</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Platform health, attention items and active work.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="size-4 text-emerald-400" />
          Core contract preview
        </div>
      </div>

      {attention.length > 0 && (
        <section aria-labelledby="needs-attention">
          <div className="mb-2 flex items-center justify-between">
            <h2 id="needs-attention" className="text-sm font-semibold text-slate-200">Needs attention</h2>
            <span className="text-xs text-slate-600">{attention.length} item{attention.length === 1 ? "" : "s"}</span>
          </div>
          <div className="overflow-hidden rounded-lg border border-[var(--bh-harbor-orange)]/25 bg-[var(--bh-harbor-orange)]/[.035]">
            {attention.map((app, index) => (
              <Link key={app.id} href={`/applications/${encodeURIComponent(app.id)}`} className={`flex items-center gap-4 px-4 py-3 hover:bg-white/[.025] ${index > 0 ? "border-t border-[var(--border)]" : ""}`}>
                <CircleAlert className="size-4 shrink-0 text-[var(--bh-harbor-orange)]" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-200">{app.name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{app.environment} / {app.target} · observed {app.observedState} · readiness {app.readiness}</div>
                </div>
                <HealthBadge value={app.health} />
                <ArrowRight className="size-4 text-slate-600" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Panel title="Applications" subtitle={`${summary.applications} total · ${applications.filter((a) => a.observedState === "running").length} running · ${summary.degraded} degraded`}>
          <div className="divide-y divide-[var(--border)]">
            {applications.map((app) => (
              <Link key={app.id} href={`/applications/${encodeURIComponent(app.id)}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[.02]">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-200">{app.name}</div>
                  <div className="mt-1 text-xs text-slate-600">{app.environment} / {app.target} · {app.revision}</div>
                </div>
                <span className="text-xs text-slate-500">{app.observedState}</span>
                <HealthBadge value={app.health} />
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="Targets" subtitle="Runtime and Target Access health">
          <div className="divide-y divide-[var(--border)]">
            {targets.map((target) => (
              <Link key={target.id} href="/targets" className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[.02]">
                <Server className="size-4 text-slate-600" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-200">{target.name}</div>
                  <div className="mt-1 text-xs text-slate-600">{target.runtimeProvider} / {target.accessProvider}</div>
                </div>
                <HealthBadge value={target.health} />
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Running operations"
        subtitle="Long-running Core executions"
        action={<Link href="/operations" className="text-xs text-[var(--bh-signal-blue)] hover:text-white">All operations →</Link>}
      >
        {running.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {running.map((execution) => (
              <Link key={execution.executionId} href="/operations" className="block px-5 py-4 hover:bg-white/[.02]">
                <div className="flex items-center gap-3">
                  <Activity className="size-4 text-[var(--bh-signal-blue)]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-200">{execution.operationId}</div>
                    <div className="mt-1 text-xs text-slate-600">{execution.resource} · {execution.actor} · {execution.message}</div>
                  </div>
                  <div className="text-xs font-medium text-slate-400">{execution.progress ?? 0}%</div>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[.04]">
                  <div className="h-full rounded-full bg-[var(--bh-signal-blue)]" style={{ width: `${execution.progress ?? 0}%` }} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-sm text-slate-500">No operations are currently running.</div>
        )}
      </Panel>
    </div>
  );
}
