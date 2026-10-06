"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { useCoreSession } from "@/components/shell/core-session-provider";
import { MachineOperationFailure } from "@/lib/baseharbor/machine-session";
import { BaseHarborApiError } from "@/lib/baseharbor/client";
import type { MachineExecution } from "@/lib/baseharbor/machine-wire";

const controlClass = "min-h-10 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-sm text-slate-200";

// Authentication is established with this installation before the Console can
// request setup. Core owns providers, protected recovery files and readiness.
export function CoreSetup() {
  const { machine, mode } = useCoreSession();
  if (!machine) return mode === "live" ? <Panel title="Core setup"><p className="p-5 text-sm text-slate-400">Sign in to the installation to request setup.</p></Panel> : null;
  return <ConnectedCoreSetup />;
}

function ConnectedCoreSetup() {
  const { machine } = useCoreSession();
  const [environment, setEnvironment] = useState("");
  const [target, setTarget] = useState("");
  const [role, setRole] = useState("development");
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [execution, setExecution] = useState<MachineExecution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => { active.current?.abort(); active.current = null; }, []);
  const descriptor = machine?.discovery.operations.find(item => item.id === "control-plane.up");
  function reset() { setApproved(false); setExecution(null); setError(null); }
  async function submit() {
    if (!machine || !descriptor || !approved || !environment || !target.trim() || busy) return;
    const controller = new AbortController(); active.current = controller; setBusy(true); setError(null); setExecution(null);
    try { await machine.run(descriptor.id, { environment, target: target.trim() }, { machine_role: role }, { signal: controller.signal, timeoutMs: 300000, onExecution: value => { if (!controller.signal.aborted) setExecution(value); } }); }
    catch (failure) { if (!controller.signal.aborted) { if (failure instanceof MachineOperationFailure) { setExecution(failure.execution); setError(`${failure.execution.error?.code}: ${failure.message} ${failure.execution.error?.next ?? ""}`); } else if (failure instanceof BaseHarborApiError && failure.status === 403) setError("Core denied this setup request. Obtain the required installation permission before retrying."); else setError("Observation ended. Check the Core execution before submitting setup again."); } }
    finally { if (active.current === controller) { active.current = null; setBusy(false); } }
  }
  return <Panel title="Set up Core" subtitle="SQL, Secrets and Identity are mandatory. No application or repository is required.">
    <form className="space-y-4 p-5" onSubmit={event => { event.preventDefault(); void submit(); }}>
      <p className="text-sm text-slate-400">Core reconciles PostgreSQL, OpenBao and Keycloak securely and verifies readiness. Retrying reuses resources owned by this installation.</p>
      <div className="flex flex-wrap gap-3">
        <label className="text-xs text-slate-400">Setup environment<select aria-label="Setup environment" required disabled={busy} className={`ml-2 ${controlClass}`} value={environment} onChange={event => { reset(); setEnvironment(event.target.value); }}><option value="">Select environment</option>{["dev", "test", "prod"].map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs text-slate-400">Installation target<input aria-label="Installation target" required disabled={busy} className={`ml-2 ${controlClass}`} maxLength={256} value={target} onChange={event => { reset(); setTarget(event.target.value); }} /></label>
      </div>
      <label className="block space-y-2 text-sm text-slate-300"><span>Is this installation running on a machine where you write code?</span><select aria-label="Machine role" disabled={busy} className={`block ${controlClass}`} value={role} onChange={event => { reset(); setRole(event.target.value); }}><option value="development">Yes, this is a development machine</option><option value="deployment">No, this is a deployment machine</option></select></label>
      <p className="text-xs text-slate-400">This sets defaults. Development favors local repositories and workspaces; deployment uses explicitly selected sources. Provider placement follows Core policy. Additional application isolation can require more provider instances and more resources.</p>
      {!descriptor && <p role="status" className="text-sm text-amber-200">This Core does not advertise setup through the Console.</p>}
      <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" disabled={busy} checked={approved} onChange={event => setApproved(event.target.checked)} />Set up the secure Core for this installation target.</label>
      <button className={controlClass} disabled={busy || !descriptor || !approved || !environment || !target.trim()}>{busy ? "Observing Core setup…" : "Set up Core"}</button>
      {error && <p role="alert" className="text-sm text-amber-200">{error}</p>}
      {execution && <div role="status" className="space-y-2 text-xs text-slate-300"><p>{execution.execution_id} · {execution.operation_id} · {execution.state}</p>{execution.progress && <p>{execution.progress.stage} · {execution.progress.message}</p>}{execution.state === "succeeded" && <p>Core setup completed. Read the current installation status to inspect readiness.</p>}</div>}
    </form>
  </Panel>;
}
