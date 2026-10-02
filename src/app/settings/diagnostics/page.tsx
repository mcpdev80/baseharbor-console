import { CheckCircle2, CircleDashed, ShieldCheck } from "lucide-react";
import { configuredCoreEndpoint, consoleRuntimeInfo } from "@/lib/baseharbor/runtime-info";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function DiagnosticsPage() {
  const endpoint = configuredCoreEndpoint();
  const contracts = [
    ["HTTP machine API", "#767", consoleRuntimeInfo.httpApi.state],
    ["Machine authorization", "#770", consoleRuntimeInfo.machineAuthorization.state],
    ["Runtime Explorer", "#768", consoleRuntimeInfo.runtimeExplorer.state],
    ["Target Access", "#769", consoleRuntimeInfo.targetAccess.state],
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div>
        <Breadcrumbs items={[{label:"Settings",href:"/settings"},{label:"Diagnostics"}]} />
        <h1 className="text-2xl font-semibold tracking-tight text-white">Console diagnostics</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Development/runtime mode and contract readiness without inventing a temporary backend.</p>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
        <h2 className="text-sm font-semibold text-slate-100">Runtime</h2>
        <dl className="mt-4 grid grid-cols-[180px_1fr] gap-x-4 gap-y-3 text-xs">
          <dt className="text-slate-600">Data mode</dt><dd className="text-slate-300">{consoleRuntimeInfo.dataMode}</dd>
          <dt className="text-slate-600">Adapter</dt><dd className="font-mono text-slate-300">{consoleRuntimeInfo.adapter}</dd>
          <dt className="text-slate-600">Configured Core endpoint</dt><dd className="font-mono text-slate-300">{endpoint}</dd>
          <dt className="text-slate-600">Direct runtime control</dt><dd className="text-emerald-300">disabled</dd>
          <dt className="text-slate-600">Direct connector control</dt><dd className="text-emerald-300">disabled</dd>
        </dl>
      </section>

      <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">
        <div className="border-b border-[var(--border)] px-5 py-4"><h2 className="text-sm font-semibold text-slate-100">Core contract readiness</h2></div>
        <div className="divide-y divide-[var(--border)]">
          {contracts.map(([name, issue, state]) => (
            <div key={name} className="flex items-center gap-4 px-5 py-4">
              {state === "ui-ready" ? <CheckCircle2 className="size-4 text-emerald-400" /> : <CircleDashed className="size-4 text-amber-300" />}
              <div className="min-w-0 flex-1"><div className="text-sm text-slate-200">{name}</div><div className="mt-1 text-xs text-slate-600">{issue}</div></div>
              <span className="text-xs text-slate-500">{state}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3 rounded-lg border border-[var(--border)] bg-white/[.018] p-4 text-xs leading-5 text-slate-400">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
        Fixture mode exists only to build the final UI contract shape. The browser still has no direct Docker, Podman, Kubernetes, OpenShift or Node Connector path.
      </div>
    </div>
  );
}
