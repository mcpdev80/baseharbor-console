"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Panel } from "@/components/ui/panel";
import { useCoreSession } from "@/components/shell/core-session-provider";
import { MachineOperationFailure } from "@/lib/baseharbor/machine-session";
import { verifiedManagedRotation } from "@/lib/baseharbor/core-rotation";
import type { MachineExecution } from "@/lib/baseharbor/machine-wire";

const controlClass = "min-h-10 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-sm text-slate-200";

export function LiveCoreRotation({ children }: { children: ReactNode }) {
  const { machine, mode } = useCoreSession();
  if (machine) return <ConnectedCoreRotation />;
  if (mode === "live") return <Panel title="Core session ended"><p className="p-5 text-sm text-slate-400">Sign in to this installation before requesting rotation.</p></Panel>;
  return children;
}

function ConnectedCoreRotation() {
  const { machine } = useCoreSession();
  const [environment, setEnvironment] = useState("");
  const [target, setTarget] = useState("");
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [execution, setExecution] = useState<MachineExecution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => { active.current?.abort(); active.current = null; }, []);
  const descriptor = machine?.discovery.operations.find(item => item.id === "openbao.rotate");
  function reset() { setApproved(false); setExecution(null); setError(null); }
  async function submit() {
    if (!machine || !descriptor || !approved || !environment || !target.trim() || busy) return;
    const controller = new AbortController(); active.current = controller;
    setBusy(true); setError(null); setExecution(null);
    try {
      const result = await machine.run(descriptor.id, { environment, target: target.trim() }, { approval: true }, {
        signal: controller.signal, timeoutMs: 300000, onExecution: value => { if (!controller.signal.aborted) setExecution(value); },
      });
      if (!controller.signal.aborted && !verifiedManagedRotation(result)) setError("Core did not verify managed trust readiness. Inspect this execution before continuing.");
    } catch (failure) {
      if (!controller.signal.aborted) {
        if (failure instanceof MachineOperationFailure) { setExecution(failure.execution); setError(`${failure.execution.error?.code}: ${failure.message} ${failure.execution.error?.next ?? ""}`); }
        else setError("Rotation observation ended. Inspect this Core execution and installation readiness before submitting again.");
      }
    } finally { if (active.current === controller) { active.current = null; setBusy(false); } }
  }
  return <Panel title="Rotate managed Core trust" subtitle="Core owns recovery material, credential replacement and verification.">
    <form className="space-y-4 p-5" onSubmit={event => { event.preventDefault(); void submit(); }}>
      <p className="text-sm text-slate-400">Rotate PostgreSQL administration credentials, the OpenBao manager credential and managed service CA for this installation. Core verifies replacements before retiring previous material. Recovery keys and credentials remain with Core.</p>
      <label className="block text-xs text-slate-400">Rotation environment<select aria-label="Rotation environment" disabled={busy} required className={`ml-2 ${controlClass}`} value={environment} onChange={event => { reset(); setEnvironment(event.target.value); }}><option value="">Select environment</option>{["dev", "test", "prod"].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="block text-xs text-slate-400">Rotation target<input aria-label="Rotation target" disabled={busy} required maxLength={256} className={`ml-2 ${controlClass}`} value={target} onChange={event => { reset(); setTarget(event.target.value); }} /></label>
      {!descriptor && <p role="status" className="text-sm text-amber-200">This Core does not advertise managed trust rotation over HTTP.</p>}
      <label className="flex items-center gap-2 text-sm text-amber-200"><input type="checkbox" disabled={busy} checked={approved} onChange={event => setApproved(event.target.checked)} />I approve managed trust rotation for this exact installation target and environment.</label>
      <button className={controlClass} disabled={busy || !descriptor || !approved || !environment || !target.trim()}>{busy ? "Observing rotation…" : "Rotate managed trust"}</button>
      {error && <p role="alert" className="text-sm text-amber-200">{error}</p>}
      {execution && <div role="status" className="space-y-2 text-xs text-slate-300"><p>{execution.execution_id} · {execution.operation_id} · {execution.state} · {execution.actor.subject || execution.actor.mode}</p>{execution.progress && <p>{execution.progress.stage} · {execution.progress.message}</p>}{verifiedManagedRotation(execution) && <p>Core verified managed trust rotation and readiness.</p>}</div>}
    </form>
  </Panel>;
}
