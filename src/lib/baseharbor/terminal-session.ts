import { BaseHarborHttpTransport } from "./client.ts";
import { resolveMachineBinding } from "./discovery.ts";
import type { MachineDiscovery } from "./discovery.ts";
import { decodeMachineContext } from "./machine-wire.ts";
import type { MachineContext } from "./machine-wire.ts";
import { openDiscoveredEventStream } from "./streams.ts";
import type { StreamHandle } from "./streams.ts";
import { decodeTerminalDescriptor, decodeTerminalEvent, validateTerminalSize } from "./terminal-wire.ts";
import type { TerminalDescriptor } from "./terminal-wire.ts";

export interface TerminalCallbacks { ready?(terminal: CoreTerminal): void; output(data: Uint8Array): void | Promise<void>; exit(code: number): void; error(error: Error): void; }
export class CoreTerminal implements StreamHandle {
  readonly descriptor: TerminalDescriptor;
  readonly done: Promise<void>;
  private readonly transport: BaseHarborHttpTransport;
  private readonly discovery: MachineDiscovery;
  private readonly controller = new AbortController();
  private readonly stream: StreamHandle;
  private readonly removeAbort: () => void;
  private readonly ready: Promise<void>;
  private closed = false;
  private inputSequence = 0;
  private queue: Promise<void> = Promise.resolve();
  private pendingBytes = 0;
  private pendingFrames = 0;

  private constructor(transport: BaseHarborHttpTransport, discovery: MachineDiscovery, descriptor: TerminalDescriptor, callbacks: TerminalCallbacks, signal: AbortSignal) {
    this.transport = transport; this.discovery = discovery; this.descriptor = descriptor;
    const events = resolveMachineBinding(discovery, "terminal_events", { stream_id: descriptor.stream_id });
    let ready = false, exited = false, sequence = 0;
    let admit = () => {}, rejectReady: (error: Error) => void = () => {};
    this.ready = new Promise<void>((resolve, reject) => { admit = resolve; rejectReady = reject; });
    const fail = (error: Error) => { if (this.closed) return; rejectReady(error); this.close(); callbacks.error(error); };
    this.stream = openDiscoveredEventStream({ href: events.href, protocol: "sse" }, async message => {
      const event = decodeTerminalEvent(JSON.parse(message.data), descriptor.stream_id);
      if (this.closed || event.sequence !== sequence + 1 || message.lastEventId !== String(event.sequence) || message.type !== event.kind || exited) throw new Error("Terminal event order or correlation differs");
      sequence = event.sequence;
      if (event.kind === "terminal.ready") { if (ready || sequence !== 1) throw new Error("Terminal readiness was replayed"); ready = true; callbacks.ready?.(this); admit(); return; }
      if (!ready) throw new Error("Terminal output arrived before readiness");
      if (event.kind === "terminal.output") { await this.render(() => callbacks.output(event.data!)); return; }
      exited = true; callbacks.exit(event.exit_code!); this.close();
    }, fail, transport);
    this.done = this.stream.done.then(() => { if (!this.closed && !exited) fail(new Error("Terminal disconnected without an exit status; input is never replayed")); });
    const abort = () => { rejectReady(new Error("Terminal session ended")); this.close(); };
    signal.addEventListener("abort", abort, { once: true });
    this.removeAbort = () => signal.removeEventListener("abort", abort);
    if (signal.aborted) abort();
  }

  static async open(transport: BaseHarborHttpTransport, discovery: MachineDiscovery, selectedContext: MachineContext, resourceKind: string, resourceId: string, command: readonly string[], rows: number, columns: number, callbacks: TerminalCallbacks, signal: AbortSignal): Promise<CoreTerminal> {
    if (!discovery.capabilities.includes("streams.terminal")) throw new Error("Core did not advertise terminal transport");
    for (const [name, method] of [["terminal_open", "POST"], ["terminal_input", "POST"], ["terminal_close", "DELETE"], ["terminal_events", "GET"]]) {
      const binding = discovery.http[name]; if (!binding || binding.method !== method || name === "terminal_events" && binding.protocol !== "sse") throw new Error("Core terminal bindings are incompatible");
    }
    validateTerminalSize(rows, columns);
    const selected = decodeMachineContext(selectedContext);
    if (!selected.environment?.trim() || !selected.target?.trim() || resourceKind !== "container" || !resourceId || resourceId.length > 4096 || selected.resource !== undefined && selected.resource !== resourceId) throw new Error("Select a container, target and environment for terminal access");
    if (!Array.isArray(command) || command.length < 1 || command.length > 64 || !command[0] || command.some(arg => typeof arg !== "string" || arg.includes("\0")) || command.reduce((bytes, arg) => bytes + new TextEncoder().encode(arg).byteLength, 0) > 16384) throw new Error("Terminal requires bounded explicit container argv");
    const context = Object.freeze({ ...selected, environment: selected.environment.trim().toLowerCase(), resource: resourceId });
    const binding = resolveMachineBinding(discovery, "terminal_open");
    const openSignal = AbortSignal.any([signal, AbortSignal.timeout(15000)]);
    const descriptor = await transport.request({ ...binding, body: { contract_version: "v1", kind: "exec", context, resource_kind: resourceKind, resource_id: resourceId, command: [...command], rows, columns, tty: true }, signal: openSignal }, value => decodeTerminalDescriptor(value, context, resourceKind, resourceId));
    const terminal = new CoreTerminal(transport, discovery, descriptor, callbacks, signal);
    try { await terminal.render(() => terminal.ready); return terminal; }
    catch (error) { terminal.close(); throw error; }
  }

  close(): void {
    if (this.closed) return;
    this.closed = true; this.controller.abort(); this.stream.close(); this.removeAbort();
    // Best effort explicit teardown. An aborted output attachment also closes
    // Core's PTY; an ambiguous input/close request is never retried.
    const binding = resolveMachineBinding(this.discovery, "terminal_close", { stream_id: this.descriptor.stream_id });
    void this.transport.open({ ...binding, signal: AbortSignal.timeout(5000) }).then(response => response.body?.cancel()).catch(() => undefined);
  }

  write(data: Uint8Array): Promise<void> {
    if (!(data instanceof Uint8Array) || data.byteLength < 1 || data.byteLength > 16384) return Promise.reject(new Error("Terminal input exceeds the bounded frame size"));
    const copy = new Uint8Array(data);
    return this.send({ kind: "input", data: btoa(String.fromCharCode(...copy)) }, copy.byteLength);
  }
  resize(rows: number, columns: number): Promise<void> { validateTerminalSize(rows, columns); return this.send({ kind: "resize", rows, columns }, 0); }

  private send(frame: Record<string, unknown>, bytes: number): Promise<void> {
    if (this.closed) return Promise.reject(new Error("Terminal is closed"));
    if (this.pendingFrames >= 16 || this.pendingBytes + bytes > 65536 || this.inputSequence >= Number.MAX_SAFE_INTEGER) { this.close(); return Promise.reject(new Error("Terminal backpressure bound exceeded; open a new session")); }
    const sequence = ++this.inputSequence; this.pendingFrames++; this.pendingBytes += bytes;
    const result = this.queue.then(async () => {
      if (this.closed) throw new Error("Terminal is closed");
      const binding = resolveMachineBinding(this.discovery, "terminal_input", { stream_id: this.descriptor.stream_id });
      const signal = AbortSignal.any([this.controller.signal, AbortSignal.timeout(5000)]);
      const response = await this.transport.open({ ...binding, body: { contract_version: "v1", sequence, ...frame }, signal });
      await response.body?.cancel();
      if (response.status !== 204) throw new Error("Terminal input acknowledgement differs");
    }).catch(error => { this.close(); throw error; }).finally(() => { this.pendingFrames--; this.pendingBytes -= bytes; });
    this.queue = result.catch(() => undefined);
    return result;
  }

  private render(callback: () => void | Promise<void>): Promise<void> {
    const signal = AbortSignal.any([this.controller.signal, AbortSignal.timeout(5000)]);
    return new Promise<void>((resolve, reject) => {
      const abort = () => reject(new Error("Terminal renderer or readiness deadline exceeded"));
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) { signal.removeEventListener("abort", abort); reject(new Error("Terminal closed")); return; }
      Promise.resolve().then(callback).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
    });
  }
}
