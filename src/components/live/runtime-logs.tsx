"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { useCoreSession } from "@/components/shell/core-session-provider";
import { decodeRuntimeCapabilities } from "@/lib/baseharbor/read-models";
import type { RuntimeRow } from "@/lib/baseharbor/read-models";
import type { MachineContext } from "@/lib/baseharbor/machine-wire";
import { retainLogOutput } from "@/lib/baseharbor/log-stream";
import type { StreamHandle } from "@/lib/baseharbor/streams";

const control = "min-h-10 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-sm text-slate-200";
export function RuntimeLogs({ resources, context }: { resources: readonly RuntimeRow[]; context: MachineContext }) {
  const { machine } = useCoreSession();
  const [selection, setSelection] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("Closed");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const active = useRef<{ controller: AbortController; stream?: StreamHandle } | null>(null);
  useEffect(() => () => { active.current?.controller.abort(); active.current?.stream?.close(); active.current = null; }, []);
  const containers = resources.filter(row => row.ref.kind === "container" && ["managed", "platform"].includes(row.ownership));
  function stop() { active.current?.controller.abort(); active.current?.stream?.close(); active.current = null; setBusy(false); setStatus("Stopped"); }
  async function read(follow: boolean) {
    const resource = containers[Number(selection)];
    if (!machine || selection === "" || !resource || active.current) return;
    const current: { controller: AbortController; stream?: StreamHandle } = { controller: new AbortController() };
    active.current = current; setBusy(true); setText(""); setError(null); setStatus("Checking runtime…");
    const fail = () => { current.controller.abort(); current.stream?.close(); if (active.current === current) { active.current = null; setBusy(false); setStatus("Disconnected"); setError("Core could not complete this log stream. Start a new observation to retry."); } };
    try {
      const execution = await machine.run("runtime.capabilities", context, {}, { signal: current.controller.signal });
      const capabilities = decodeRuntimeCapabilities(execution.result, resource.ref.target);
      if (capabilities.provider !== resource.ref.provider || !capabilities.capabilities.includes("logs")) throw new Error("Core log capability unavailable");
      if (current.controller.signal.aborted) return;
      current.stream = machine.openLogs(context, resource.ref.resource_id, follow, {
        ready: () => { if (active.current === current) setStatus(follow ? "Following" : "Reading"); },
        output: value => { if (active.current === current) setText(previous => retainLogOutput(previous, value)); },
        end: () => { if (active.current === current) { active.current = null; setBusy(false); setStatus("Stream ended"); } },
        error: fail,
      }, current.controller.signal);
    } catch { if (!current.controller.signal.aborted) fail(); }
  }
  return <Panel title="Container logs" subtitle="Read the last 100 lines or follow one owned Core resource. The view retains at most 64K characters.">
    <div className="space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-3"><label className="text-xs text-slate-400">Resource<select aria-label="Log resource" disabled={busy} value={selection} onChange={event => { stop(); setSelection(event.target.value); setText(""); setError(null); setStatus("Closed"); }} className={`ml-2 ${control}`}><option value="">Select container</option>{containers.map((row, index) => <option key={row.ref.resource_id} value={index}>{row.display_name || row.runtime_name || row.ref.resource_id}</option>)}</select></label><button disabled={busy || selection === ""} className={control} onClick={() => void read(false)}>Read logs</button><button disabled={busy || selection === ""} className={control} onClick={() => void read(true)}>Follow logs</button>{busy && <button className={control} onClick={stop}>Stop logs</button>}</div>
      <p role="status" className="text-xs text-slate-400">{status}</p>
      {error && <p role="alert" className="text-sm text-amber-200">{error}</p>}
      <pre role="log" aria-live="off" aria-label="Container log output" className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-black/20 p-3 text-xs text-slate-300">{text}</pre>
    </div>
  </Panel>;
}
