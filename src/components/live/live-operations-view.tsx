"use client";

import type { ReactNode } from "react";
import { Panel } from "@/components/ui/panel";
import { useCoreSession } from "@/components/shell/core-session-provider";

export function LiveOperationsView({ children }: { children: ReactNode }) {
  const { machine, mode, showPreview } = useCoreSession();
  if (!machine && mode === "preview") return children;
  if (!machine) return <Panel title="Core session ended" subtitle="Sign in to read Core again."><button type="button" onClick={showPreview} className="m-5 min-h-10 rounded-md border border-[var(--border)] px-3 text-sm text-slate-300">View fixture preview</button></Panel>;
  return <div className="mx-auto max-w-[1500px] space-y-6">
    <div><p className="text-xs uppercase text-[var(--bh-signal-blue)]">Connected Core</p><h1 className="mt-2 text-2xl font-semibold text-white">Operations</h1><p className="mt-2 text-sm text-slate-400">Supported operations and safety metadata from your authenticated Core discovery.</p></div>
    <Panel title="Operation contract" subtitle="Core enforces authorization, policy, ownership and verification for every submission.">
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr>{["Operation", "Safety", "Confirmation", "Policy", "Contract"].map(label => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-[var(--border)]">{machine.discovery.operations.map(operation => <tr key={operation.id}><td className="px-5 py-3 text-slate-200">{operation.id}<p className="mt-1 text-xs text-slate-500">{operation.description}</p></td><td className="px-5 py-3 text-slate-300">{operation.safety}</td><td className="px-5 py-3 text-slate-300">{operation.confirmation_required ? "Required" : "No"}</td><td className="px-5 py-3 text-slate-300">{operation.policy_required ? "Required" : "No"}</td><td className="px-5 py-3 text-slate-300">{operation.contract_version}</td></tr>)}</tbody></table></div>
    </Panel>
    <Panel title="Execution observation" subtitle="Submit a supported application operation from Applications."><p className="p-5 text-sm text-slate-400">That workflow displays the current execution identity, progress, actor and final Core result. A global execution history is unavailable through this discovery; no sample history is shown.</p></Panel>
  </div>;
}
