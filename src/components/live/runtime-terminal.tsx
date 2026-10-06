"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { useCoreSession } from "@/components/shell/core-session-provider";
import { decodeRuntimeCapabilities } from "@/lib/baseharbor/read-models";
import type { RuntimeRow } from "@/lib/baseharbor/read-models";
import type { MachineContext } from "@/lib/baseharbor/machine-wire";
import type { CoreTerminal } from "@/lib/baseharbor/terminal-session";

const control = "min-h-10 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-sm text-slate-200";
export function RuntimeTerminal({ resources, context }: { resources: readonly RuntimeRow[]; context: MachineContext }) {
  const { machine } = useCoreSession();
  const [selection, setSelection] = useState("");
  const [program, setProgram] = useState("/bin/sh");
  const [argumentsText, setArgumentsText] = useState("");
  const [status, setStatus] = useState("Closed");
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const host = useRef<HTMLDivElement | null>(null);
  const active = useRef<{ controller: AbortController; terminal?: CoreTerminal; dispose(): void } | null>(null);
  useEffect(() => () => { active.current?.dispose(); active.current = null; }, []);
  const containers = resources.filter(resource => resource.ref.kind === "container" && ["managed", "platform"].includes(resource.ownership));
  function close() { active.current?.dispose(); active.current = null; setStatus("Closed"); setOpening(false); setEngaged(false); }
  async function open() {
    const resource = containers[Number(selection)];
    if (!machine || selection === "" || !resource || !program.trim() || !host.current || active.current) return;
    setEngaged(true); setOpening(true); setStatus("Checking runtime capability…"); setError(null);
    const controller = new AbortController();
    let disposeScreen = () => {};
    let disposed = false, exitStatus: number | undefined;
    const current: { controller: AbortController; terminal?: CoreTerminal; dispose(): void } = { controller, dispose() { if (disposed) return; disposed = true; controller.abort(); current.terminal?.close(); disposeScreen(); } };
    active.current = current;
    const fail = () => { current.dispose(); if (active.current === current) { active.current = null; setOpening(false); setEngaged(false); setStatus("Disconnected"); setError("Terminal did not complete. Open a new session; input is never replayed."); } };
    try {
      const capabilityExecution = await machine.run("runtime.capabilities", context, {}, { signal: controller.signal });
      const capabilities = decodeRuntimeCapabilities(capabilityExecution.result, resource.ref.target);
      if (capabilities.provider !== resource.ref.provider || !capabilities.capabilities.includes("container.terminal") || !capabilities.resource_kinds.includes("container")) throw new Error("Terminal capability unavailable");
      const [{ Terminal }, { FitAddon }] = await Promise.all([import("@xterm/xterm"), import("@xterm/addon-fit")]);
      if (controller.signal.aborted || !host.current) return;
      const screen = new Terminal({ cursorBlink: true, disableStdin: true, scrollback: 1000, screenReaderMode: true, fontSize: 13, theme: { background: "#071b2a", foreground: "#cbd5e1", cursor: "#38bdf8" } });
      const fit = new FitAddon(); screen.loadAddon(fit); screen.open(host.current); fit.fit();
      const input = screen.onData(value => { if (current.terminal) void current.terminal.write(new TextEncoder().encode(value)).catch(fail); });
      let resizeTimer: ReturnType<typeof setTimeout> | undefined;
      const resize = new ResizeObserver(() => { if (resizeTimer) clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (controller.signal.aborted) return; fit.fit(); if (current.terminal) void current.terminal.resize(Math.min(screen.rows, 512), Math.min(screen.cols, 512)).catch(fail); }, 100); });
      resize.observe(host.current);
      disposeScreen = () => { if (resizeTimer) clearTimeout(resizeTimer); resize.disconnect(); input.dispose(); screen.dispose(); };
      setStatus("Opening terminal…");
      const terminal = await machine.openTerminal(context, "container", resource.ref.resource_id, [program.trim(), ...(argumentsText ? argumentsText.split("\n") : [])], Math.min(screen.rows, 512), Math.min(screen.cols, 512), {
        output: bytes => new Promise<void>(resolve => screen.write(bytes, resolve)),
        exit: code => { exitStatus = code; if (active.current === current) { setStatus(`Exited (${code})`); setOpening(false); } },
        error: fail,
      }, controller.signal);
      current.terminal = terminal;
      if (controller.signal.aborted) { terminal.close(); return; }
      if (exitStatus === undefined) { setStatus(`Connected · ${terminal.descriptor.stream_id}`); screen.options.disableStdin = false; } setOpening(false); screen.focus();
    } catch { if (!controller.signal.aborted) fail(); }
  }
  return <Panel title="Container terminal" subtitle="Select one owned Core resource and an explicit container program. Core verifies current capabilities, actor, policy and ownership.">
    <form onSubmit={event => { event.preventDefault(); void open(); }} className="space-y-3 p-5">
      <div className="flex flex-wrap items-end gap-3"><label className="text-xs text-slate-400">Resource<select aria-label="Terminal resource" required disabled={opening || engaged} value={selection} onChange={event => setSelection(event.target.value)} className={`ml-2 ${control}`}><option value="">Select container</option>{containers.map((resource, index) => <option value={index} key={resource.ref.resource_id}>{resource.display_name || resource.runtime_name || resource.ref.resource_id}</option>)}</select></label><label className="text-xs text-slate-400">Container program<input required disabled={opening || engaged} value={program} onChange={event => setProgram(event.target.value)} className={`ml-2 ${control}`} /></label></div>
      <label className="block space-y-1 text-xs text-slate-400"><span>Arguments (one per line)</span><textarea disabled={opening || engaged} value={argumentsText} onChange={event => setArgumentsText(event.target.value)} rows={2} className={`block w-full max-w-xl py-2 ${control}`} /></label>
      <div className="flex items-center gap-3"><button disabled={opening || engaged || selection === ""} className={control}>Open terminal</button><button type="button" onClick={close} className={control}>Close terminal</button><p role="status" className="text-xs text-slate-400">{status}</p></div>
      {error && <p role="alert" className="text-sm text-amber-200">{error}</p>}
      <div ref={host} aria-label="Container terminal" className="h-80 min-w-0 overflow-hidden rounded-md bg-[#071b2a] p-2" />
    </form>
  </Panel>;
}
