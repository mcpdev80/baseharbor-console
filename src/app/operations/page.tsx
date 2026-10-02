import { Activity, ShieldCheck, TriangleAlert } from "lucide-react";
import { baseHarborData } from "@/lib/baseharbor/data";
import { Panel } from "@/components/ui/panel";
import { ExecutionList } from "@/components/operations/execution-list";
import { ContractPending } from "@/components/ui/contract-pending";

export default async function OperationsPage() {
  const [executions, operations] = await Promise.all([
    baseHarborData.executions(),
    baseHarborData.operations(),
  ]);

  const running = executions.filter((execution) => execution.state === "running").length;
  const destructive = operations.filter((operation) => operation.safety === "destructive").length;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[.18em] text-[var(--bh-signal-blue)]">Operate</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Operations</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Execution identities, progress, safety classes and structured results from the shared BaseHarbor machine contract.</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-5 py-4 text-xs">
        <span className="inline-flex items-center gap-2 text-slate-400"><ShieldCheck className="size-4 text-slate-600" /><strong className="font-semibold text-slate-200">{operations.length}</strong> known operations</span>
        <span className="inline-flex items-center gap-2 text-slate-400"><Activity className="size-4 text-sky-400" /><strong className="font-semibold text-slate-200">{running}</strong> running</span>
        <span className="inline-flex items-center gap-2 text-slate-400"><TriangleAlert className="size-4 text-rose-300" /><strong className="font-semibold text-slate-200">{destructive}</strong> destructive</span>
      </div>

      <ContractPending
        issue="#767/#770"
        title="Live operation discovery and execution binding pending"
        description="This page already models execution identity, progress, SafetyClass, confirmation and policy metadata. Live discovery/submission will bind only to the finalized protected Core machine contract."
      />

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
