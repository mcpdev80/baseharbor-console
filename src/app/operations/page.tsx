import { Activity, ShieldCheck } from "lucide-react";
import { baseHarborData } from "@/lib/baseharbor/data";
import { Panel } from "@/components/ui/panel";
import { ExecutionList } from "@/components/operations/execution-list";

export default async function OperationsPage() {
  const [executions, operations] = await Promise.all([
    baseHarborData.executions(),
    baseHarborData.operations(),
  ]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[.18em] text-[var(--bh-signal-blue)]">Machine operations</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Operations</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Execution identities, progress, safety classes and structured results from the shared BaseHarbor machine contract.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500"><span>Known operations</span><ShieldCheck className="size-4" /></div>
          <div className="mt-2 text-2xl font-semibold text-white">{operations.length}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500"><span>Running</span><Activity className="size-4" /></div>
          <div className="mt-2 text-2xl font-semibold text-white">{executions.filter((e) => e.state === "running").length}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <div className="text-xs text-slate-500">Destructive operations</div>
          <div className="mt-2 text-2xl font-semibold text-white">{operations.filter((op) => op.safety === "destructive").length}</div>
        </div>
      </div>

      <Panel title="Executions" subtitle="Long-running operations remain first-class and auditable.">
        <ExecutionList executions={executions} />
      </Panel>

      <Panel title="Operation contract" subtitle="Safety, confirmation and policy metadata are supplied by BaseHarbor Core.">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500">
              <tr><th className="px-5 py-3">Operation</th><th className="px-4 py-3">Safety</th><th className="px-4 py-3">Confirmation</th><th className="px-4 py-3">Policy</th><th className="px-4 py-3">Contract</th></tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {operations.map((operation) => (
                <tr key={operation.id}>
                  <td className="px-5 py-4"><div className="font-medium text-slate-200">{operation.id}</div><div className="mt-1 text-xs text-slate-600">{operation.description}</div></td>
                  <td className="px-4 py-4 text-xs text-slate-400">{operation.safety}</td>
                  <td className="px-4 py-4 text-xs text-slate-400">{operation.confirmation_required ? "required" : "no"}</td>
                  <td className="px-4 py-4 text-xs text-slate-400">{operation.policy_required ? "required" : "no"}</td>
                  <td className="px-4 py-4 font-mono text-xs text-slate-500">{operation.contract_version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
