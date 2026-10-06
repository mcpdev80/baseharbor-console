"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CoreSetup } from "./core-setup";
import { canContinueAfterCoreSetup, offersCoreBootstrap } from "@/lib/baseharbor/core-bootstrap";
import { RuntimeTerminal } from "./runtime-terminal";
import { RuntimeLogs } from "./runtime-logs";
import { RuntimeDetails } from "./runtime-details";
import { Panel } from "@/components/ui/panel";
import { useCoreSession } from "@/components/shell/core-session-provider";
import { LiveCoreAdapter } from "@/lib/baseharbor/read-models";
import type { DeploymentRow, ReadModel, RuntimeRow, TargetRow, WorkspaceRow } from "@/lib/baseharbor/read-models";
import { MachineOperationFailure } from "@/lib/baseharbor/machine-session";
import type { MachineExecution } from "@/lib/baseharbor/machine-wire";

type View = "applications" | "targets" | "workspaces" | "runtime";
type Row = DeploymentRow | TargetRow | WorkspaceRow | RuntimeRow;
const titles: Record<View, string> = { applications: "Applications", targets: "Targets", workspaces: "Workspaces", runtime: "Runtime Explorer" };
const controlClass = "min-h-10 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-sm text-slate-200";

// Preview is selected only while disconnected. Once connected, every result,
// empty state and error comes from the selected Core operation.
export function LiveCoreView({ view, children }: { view: View; children: ReactNode }) {
  const { machine, mode, showPreview } = useCoreSession();
  if (machine) return <ConnectedCoreView key={view} view={view} />;
  if (mode === "live") return <Panel title="Core session ended" subtitle="Sign in to read Core again."><button type="button" onClick={showPreview} className="m-5 min-h-10 rounded-md border border-[var(--border)] px-3 text-sm text-slate-300">View fixture preview</button></Panel>;
  return children;
}

function ConnectedCoreView({ view }: { view: View }) {
  const { machine } = useCoreSession();
  const [environment, setEnvironment] = useState("");
  const [target, setTarget] = useState("");
  const [model, setModel] = useState<ReadModel<Row> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => { active.current?.abort(); active.current = null; }, []);
  const reset = () => { active.current?.abort(); active.current = null; setModel(null); setError(null); setBusy(false); };
  async function load() {
    if (!machine || !environment || busy) return;
    const controller = new AbortController(); active.current = controller;
    const adapter = new LiveCoreAdapter(machine);
    setBusy(true); setError(null); setModel(null);
    try {
      const context = { environment, ...(target.trim() ? { target: target.trim() } : {}) };
      const result = await adapter[view](context, controller.signal);
      if (!controller.signal.aborted) setModel(result);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof MachineOperationFailure ? `${failure.execution.error?.code}: ${failure.message} ${failure.execution.error?.next ?? ""}` : "Core could not complete this request. Check the connection and execution before retrying.");
    } finally { if (active.current === controller) { active.current = null; setBusy(false); } }
  }
  return <div className="mx-auto max-w-[1600px] space-y-6">
    <div><p className="text-xs uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Connected Core</p><h1 className="mt-2 text-2xl font-semibold text-white">{titles[view]}</h1></div>
    <form onSubmit={event => { event.preventDefault(); void load(); }} className="flex flex-wrap items-end gap-3">
      <label className="space-y-1 text-xs text-slate-400"><span className="block">Environment</span><select aria-label="Environment" required value={environment} onChange={event => { reset(); setEnvironment(event.target.value); }} className={controlClass}><option value="">Select environment</option>{["dev", "test", "prod"].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="space-y-1 text-xs text-slate-400"><span className="block">Core target{view === "runtime" ? " (required)" : " (optional)"}</span><input required={view === "runtime"} value={target} maxLength={256} onChange={event => { reset(); setTarget(event.target.value); }} className={controlClass} /></label>
      <button disabled={busy || !environment} className={controlClass}>{busy ? "Reading Core…" : "Read Core"}</button>
      {busy && <button type="button" onClick={reset} className={controlClass}>Stop observing</button>}
    </form>
    {error && <p role="alert" className="text-sm text-amber-200">{error}</p>}
    {!model && !busy && !error && <p className="text-sm text-slate-400">Select your context and read Core to view current records.</p>}
    {model && <>
      {model.warnings.map((warning, index) => <p key={index} role="status" className="text-sm text-amber-200">{warning}</p>)}
      <Panel title={titles[view]} subtitle="Core records for the selected context. Missing observations are shown as unavailable.">
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr>{columns(view).map(column => <th key={column} className="px-5 py-3">{column}</th>)}</tr></thead><tbody className="divide-y divide-[var(--border)]">{model.rows.map((row, index) => <tr key={index}>{cells(view, row).map((cell, column) => <td key={column} className="px-5 py-3 text-slate-300">{cell}</td>)}</tr>)}</tbody></table></div>
        {model.rows.length === 0 && <p className="px-5 py-8 text-sm text-slate-400">Core returned no records.</p>}
      </Panel>
      {view === "applications" && <ApplicationActions deployments={model.rows as readonly DeploymentRow[]} />}
      {view === "runtime" && <RuntimeDetails key={`details/${environment}/${target}`} resources={model.rows as readonly RuntimeRow[]} context={{ environment, target: target.trim() }} />}
      {view === "runtime" && <RuntimeTerminal key={`terminal/${environment}/${target}`} resources={model.rows as readonly RuntimeRow[]} context={{ environment, target: target.trim() }} />}
      {view === "runtime" && <RuntimeLogs key={`logs/${environment}/${target}`} resources={model.rows as readonly RuntimeRow[]} context={{ environment, target: target.trim() }} />}
    </>}
  </div>;
}
function columns(view: View): string[] { return view === "applications" ? ["Application", "Deployment", "Environment", "Target", "Runtime", "Observed", "Ready"] : view === "targets" ? ["Target", "Runtime", "Access reference", "Scope", "Effective"] : view === "workspaces" ? ["Application", "Manifest", "Sources"] : ["Resource", "Kind", "Target", "Runtime", "Ownership", "Observed", "Health"]; }
function cells(view: View, row: Row): string[] {
  const display = (value: string | undefined) => value || "Unavailable";
  if (view === "applications") { const item = row as DeploymentRow; return [item.application, item.deployment_id, item.environment, item.target, display(item.runtime_provider), display(item.state), item.ready ? "Ready" : "Not ready"]; }
  if (view === "targets") { const item = row as TargetRow; return [item.name, item.runtime_provider, item.access_reference, display(item.scope), item.effective ? "Yes" : "No"]; }
  if (view === "workspaces") { const item = row as WorkspaceRow; return [item.application, item.manifest, String(item.source_count)]; }
  const item = row as RuntimeRow; return [item.display_name || item.runtime_name || item.ref.resource_id, item.ref.kind, item.ref.target, item.ref.provider, item.ownership, display(item.state?.observed), display(item.state?.health)];
}
function ApplicationActions({ deployments }: { deployments: readonly DeploymentRow[] }) {
  const { machine } = useCoreSession();
  const [selection, setSelection] = useState("");
  const [operation, setOperation] = useState("status");
  const [approved, setApproved] = useState(false);
  const [execution, setExecution] = useState<MachineExecution | null>(null);
  const [bootstrap, setBootstrap] = useState<MachineExecution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => { active.current?.abort(); active.current = null; }, []);
  const selected = deployments[Number(selection)];
  const descriptor = machine?.discovery.operations.find(item => item.id === operation);
  const supported = machine?.discovery.operations.filter(item => ["plan", "status", "doctor", "apply", "repair", "destroy"].includes(item.id)) ?? [];
  async function submit() {
    if (!machine || !selected || selection === "" || !descriptor || busy || descriptor.confirmation_required && !approved) return;
    const controller = new AbortController(); active.current = controller;
    setBusy(true); setError(null); setExecution(null); setBootstrap(null);
    try { await machine.run(operation, { application: selected.application, environment: selected.environment, target: selected.target }, operation === "destroy" ? { approval: approved } : {}, { signal: controller.signal, onExecution: record => { if (!controller.signal.aborted) setExecution(record); } }); }
    catch (failure) { if (controller.signal.aborted) return; if (failure instanceof MachineOperationFailure) { setExecution(failure.execution); if (offersCoreBootstrap(failure.execution)) setBootstrap(failure.execution); setError(`${failure.execution.error?.code}: ${failure.message} ${failure.execution.error?.next ?? ""}`); } else setError("Observation did not complete. Check the displayed execution before repeating a mutation."); }
    finally { if (active.current === controller) { active.current = null; setBusy(false); } }
  }
  const continueAfterSetup = (setup: MachineExecution) => {
    const context = selected && { application: selected.application, environment: selected.environment, target: selected.target };
    if (!bootstrap || operation !== "apply" || !context || !canContinueAfterCoreSetup(bootstrap, context, setup)) {
      setError("Core setup finished. Review the selected application before submitting a new operation."); return;
    }
    setBootstrap(null); void submit();
  };
  return <><Panel title="Application operation" subtitle="Core decides policy, ownership, execution and verification. Review the exact selected deployment before submitting.">
    <form onSubmit={event => { event.preventDefault(); void submit(); }} className="space-y-3 p-5">
      <div className="flex flex-wrap gap-3"><label className="text-xs text-slate-400">Deployment<select aria-label="Deployment" required disabled={busy} value={selection} onChange={event => { setSelection(event.target.value); setApproved(false); setExecution(null); setError(null); setBootstrap(null); }} className={`ml-2 ${controlClass}`}><option value="">Select deployment</option>{deployments.map((row, index) => <option value={index} key={row.deployment_id}>{row.application} / {row.environment} / {row.target}</option>)}</select></label><label className="text-xs text-slate-400">Operation<select aria-label="Operation" disabled={busy} value={operation} onChange={event => { setOperation(event.target.value); setApproved(false); setBootstrap(null); }} className={`ml-2 ${controlClass}`}>{supported.map(item => <option key={item.id}>{item.id}</option>)}</select></label></div>
      {descriptor && <p className="text-xs text-slate-400">{descriptor.description} · {descriptor.safety} · {descriptor.policy_required ? "Core policy required" : "Core authorization"}</p>}
      {descriptor?.confirmation_required && <label className="flex items-center gap-2 text-sm text-amber-200"><input type="checkbox" checked={approved} disabled={busy} onChange={event => setApproved(event.target.checked)} />I approve {operation} for this exact application, environment and target.</label>}
      <button disabled={busy || selection === "" || !descriptor || descriptor.confirmation_required && !approved} className={controlClass}>{busy ? "Observing execution…" : "Submit to Core"}</button>
      {error && <p role="alert" className="text-sm text-amber-200">{error}</p>}
      {execution && <div role="status" className="space-y-2 text-xs text-slate-300"><p>{execution.execution_id} · {execution.operation_id} · {execution.state} · {execution.actor.subject || execution.actor.mode}</p>{execution.progress && <p>{execution.progress.stage} · {execution.progress.message}{execution.progress.percent === undefined ? "" : ` · ${execution.progress.percent}%`}</p>}{execution.result !== undefined && <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-black/20 p-3">{JSON.stringify(execution.result, null, 2)}</pre>}</div>}
    </form>
  </Panel>
    {bootstrap && selected && <div className="space-y-3">
      <p className="text-sm text-slate-300">BaseHarbor needs its Core services before the first application can run. Set them up below to continue apply for {selected.application} / {selected.environment} / {selected.target}.</p>
      <CoreSetup key={`${selected.application}/${selected.environment}/${selected.target}`} context={{ environment: selected.environment, target: selected.target }} onReady={continueAfterSetup} />
    </div>}
  </>;
}
