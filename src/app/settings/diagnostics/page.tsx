import { CheckCircle2, CircleDashed, ShieldCheck } from "lucide-react";
import { configuredCoreEndpoint, consoleRuntimeInfo } from "@/lib/baseharbor/runtime-info";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

const contractRows = [
  ["HTTP machine API", "#767", consoleRuntimeInfo.contracts.httpApi],
  ["Machine authorization", "#770", consoleRuntimeInfo.contracts.machineAuthorization],
  ["Runtime Explorer", "#768", consoleRuntimeInfo.contracts.runtimeExplorer],
  ["Target Access", "#769", consoleRuntimeInfo.contracts.targetAccess],
] as const;

function Ready({ value }: { value: "ready" | "pending" }) {
  return value === "ready"
    ? <span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 className="size-3.5" />ready</span>
    : <span className="inline-flex items-center gap-1 text-amber-300"><CircleDashed className="size-3.5" />pending</span>;
}

export default function DiagnosticsPage() {
  const endpoint = configuredCoreEndpoint();

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div>
        <Breadcrumbs items={[{label:"Settings",href:"/settings"},{label:"Diagnostics"}]} />
        <h1 className="text-2xl font-semibold tracking-tight text-white">Console diagnostics</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Contract-shape, UI and live-binding readiness without inventing a temporary backend.</p>
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
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-100">Core contract readiness</h2>
          <p className="mt-1 text-xs text-slate-600">Shape/UI readiness is independent from live Core binding.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500">
              <tr><th className="px-5 py-3">Contract</th><th className="px-4 py-3">Issue</th><th className="px-4 py-3">Shape</th><th className="px-4 py-3">UI</th><th className="px-4 py-3">Live binding</th></tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {contractRows.map(([name, issue, readiness]) => (
                <tr key={name}>
                  <td className="px-5 py-4 text-slate-200">{name}</td>
                  <td className="px-4 py-4 font-mono text-xs text-slate-600">{issue}</td>
                  <td className="px-4 py-4 text-xs"><Ready value={readiness.shape} /></td>
                  <td className="px-4 py-4 text-xs"><Ready value={readiness.ui} /></td>
                  <td className="px-4 py-4 text-xs"><Ready value={readiness.liveBinding} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex gap-3 rounded-lg border border-[var(--border)] bg-white/[.018] p-4 text-xs leading-5 text-slate-400">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
        Fixture mode exists only to build the final UI contract shape. The browser has no direct Docker, Podman, Kubernetes, OpenShift or Node Connector path.
      </div>
    </div>
  );
}
