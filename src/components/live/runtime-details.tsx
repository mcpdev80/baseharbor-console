"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { useCoreSession } from "@/components/shell/core-session-provider";
import { LiveCoreAdapter } from "@/lib/baseharbor/read-models";
import type { RuntimeMetrics, RuntimeRow } from "@/lib/baseharbor/read-models";
import type { MachineContext } from "@/lib/baseharbor/machine-wire";
import { MachineOperationFailure } from "@/lib/baseharbor/machine-session";

const controlClass = "min-h-10 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-sm text-slate-200";

export function RuntimeDetails({ resources, context }: { resources: readonly RuntimeRow[]; context: MachineContext }) {
  const { machine } = useCoreSession();
  const [selection, setSelection] = useState("");
  const [detail, setDetail] = useState<RuntimeRow | null>(null);
  const [metrics, setMetrics] = useState<RuntimeMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => { active.current?.abort(); active.current = null; }, []);
  const selected = selection === "" ? undefined : resources[Number(selection)];
  function reset() { active.current?.abort(); active.current = null; setDetail(null); setMetrics(null); setError(null); setBusy(false); }
  async function read(kind: "detail" | "metrics") {
    if (!machine || !selected || busy) return;
    const controller = new AbortController(); active.current = controller; setBusy(true); setError(null);
    const adapter = new LiveCoreAdapter(machine);
    if (kind === "detail") setDetail(null); else setMetrics(null);
    try {
      if (kind === "detail") { const value = await adapter.runtimeDetail(context, selected.ref, controller.signal); if (!controller.signal.aborted) setDetail(value); }
      else { const value = await adapter.runtimeMetrics(context, selected.ref, controller.signal); if (!controller.signal.aborted) setMetrics(value); }
    } catch (failure) { if (!controller.signal.aborted) setError(failure instanceof MachineOperationFailure ? `${failure.execution.error?.code}: ${failure.message} ${failure.execution.error?.next ?? ""}` : "Core could not provide the selected observation."); }
    finally { if (active.current === controller) { active.current = null; setBusy(false); } }
  }
  const supports = (id: string) => machine?.discovery.operations.some(item => item.id === id && item.safety === "read_only");
  return <Panel title="Runtime details" subtitle="Inspect the selected resource and request its native metrics from Core.">
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-slate-400">Resource<select aria-label="Details resource" value={selection} onChange={event => { reset(); setSelection(event.target.value); }} className={`ml-2 ${controlClass}`}><option value="">Select resource</option>{resources.map((row, index) => <option key={`${row.ref.provider}/${row.ref.kind}/${row.ref.resource_id}`} value={index}>{row.display_name || row.runtime_name || row.ref.resource_id} · {row.ref.kind}</option>)}</select></label>
        <button type="button" disabled={!selected || busy || !supports("runtime.inspect")} onClick={() => void read("detail")} className={controlClass}>Inspect resource</button>
        <button type="button" disabled={!selected || busy || !supports("runtime.metrics") || selected.ref.kind !== "container"} onClick={() => void read("metrics")} className={controlClass}>Read metrics</button>
        {busy && <button type="button" onClick={reset} className={controlClass}>Stop observing</button>}
      </div>
      {error && <p role="alert" className="text-sm text-amber-200">{error}</p>}
      {detail && <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 break-all text-sm text-slate-300">{Object.entries({ Resource: detail.ref.resource_id, Provider: detail.ref.provider, Target: detail.ref.target, Kind: detail.ref.kind, Ownership: detail.ownership, Application: detail.relationship?.application, Environment: detail.relationship?.environment, Component: detail.relationship?.component, Observed: detail.state?.observed, Health: detail.state?.health, Ready: detail.state?.ready === undefined ? undefined : detail.state.ready ? "Yes" : "No" }).map(([name, value]) => <div className="contents" key={name}><dt className="text-slate-500">{name}</dt><dd>{value || "Unavailable"}</dd></div>)}</dl>}
      {metrics && <div role="status" className="space-y-2 text-sm text-slate-300">{metrics.sample ? <><p>Observed at {metrics.sample.observed_at}</p><p>CPU: {metrics.sample.cpu_percent || "Unavailable"} · Memory: {metrics.sample.memory_usage || "Unavailable"} · Network: {metrics.sample.network_io || "Unavailable"}</p></> : <p>{metrics.available ? "Core has metrics available but returned no native sample." : "Core reports metrics unavailable for this resource."}</p>}</div>}
    </div>
  </Panel>;
}
