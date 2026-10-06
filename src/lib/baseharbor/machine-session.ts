import { BaseHarborHttpTransport } from "./client.ts";
import { discoverMachine, resolveMachineBinding } from "./discovery.ts";
import type { MachineDiscovery } from "./discovery.ts";
import { decodeMachineContext, decodeMachineEvent, decodeMachineExecution } from "./machine-wire.ts";
import type { MachineContext, MachineEvent, MachineExecution } from "./machine-wire.ts";
import { openDiscoveredEventStream } from "./streams.ts";
import type { StreamHandle } from "./streams.ts";

export class MachineOperationFailure extends Error {
  readonly execution: MachineExecution;
  constructor(execution: MachineExecution) {
    super(execution.error?.message ?? "Core operation was cancelled");
    this.name = "MachineOperationFailure";
    this.execution = execution;
  }
}

// One browser session over discovered Core semantics. It owns no desired state,
// operator permissions, provider credentials or runtime fallback.
export class MachineSession {
  private readonly transport: BaseHarborHttpTransport;
  readonly discovery: MachineDiscovery;
  private readonly controller = new AbortController();
  private readonly streams = new Set<StreamHandle>();

  private constructor(transport: BaseHarborHttpTransport, discovery: MachineDiscovery) {
    this.transport = transport;
    this.discovery = discovery;
  }

  close(): void {
    this.controller.abort();
    for (const stream of this.streams) stream.close();
    this.streams.clear();
  }

  private signal(signal?: AbortSignal): AbortSignal {
    if (this.controller.signal.aborted) throw new Error("Core session has ended");
    return signal ? AbortSignal.any([this.controller.signal, signal]) : this.controller.signal;
  }

  static async connect(transport: BaseHarborHttpTransport, coreOrigin: string, signal?: AbortSignal): Promise<MachineSession> {
    return new MachineSession(transport, await discoverMachine(transport, coreOrigin, signal));
  }

  async execute(operationId: string, selectedContext: MachineContext, input: Record<string, unknown> = {}, signal?: AbortSignal): Promise<MachineExecution> {
    if (!this.discovery.operations.some(operation => operation.id === operationId)) throw new Error("Core did not advertise the selected operation");
    const selected = decodeMachineContext(selectedContext);
    if (!selected.environment?.trim()) throw new Error("Select a Core environment before execution");
    const context = Object.freeze({ ...selected, environment: selected.environment.trim().toLowerCase() });
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Machine operation input must be an object");
    const binding = resolveMachineBinding(this.discovery, "execute");
    const result = await this.transport.request({ ...binding, body: { operation_id: operationId, context, input }, signal: this.signal(signal) }, decodeMachineExecution);
    if (result.operation_id !== operationId || Object.entries(context).some(([key, value]) => result.context[key as keyof MachineContext] !== value)) throw new Error("Core execution differs from the selected operation context");
    return result;
  }

  // Submit once. Observe that identity, then fetch its authoritative result.
  // An observation failure never repeats the mutation or assumes success.
  async run(operationId: string, context: MachineContext, input: Record<string, unknown> = {}, options: { signal?: AbortSignal; timeoutMs?: number; onExecution?: (execution: MachineExecution) => void } = {}): Promise<MachineExecution> {
    const timeoutMs = options.timeoutMs ?? 120000;
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 300000) throw new Error("Invalid observation deadline");
    const signal = this.signal(AbortSignal.any([AbortSignal.timeout(timeoutMs), ...(options.signal ? [options.signal] : [])]));
    const submitted = await this.execute(operationId, context, input, signal);
    options.onExecution?.(submitted);
    let completed = submitted;
    if (submitted.state === "pending" || submitted.state === "running") {
      await new Promise<void>((resolve, reject) => {
        let terminal = false;
        const abort = () => { stream.close(); reject(signal.reason ?? new Error("Observation ended")); };
        const stream = this.watchExecution(submitted, event => {
          if (event.kind === "operation.started" || event.kind === "operation.progress") options.onExecution?.(Object.freeze({ ...submitted, state: "running", ...(event.progress ? { progress: event.progress } : {}) }));
          if (event.kind === "operation.succeeded" || event.kind === "operation.failed" || event.kind === "operation.cancelled") { terminal = true; stream.close(); resolve(); }
        }, reject);
        signal.addEventListener("abort", abort, { once: true });
        if (signal.aborted) abort();
        void stream.done.then(() => { if (!terminal) reject(new Error("Core observation ended before a terminal event; check the execution identity before retrying")); }).finally(() => { signal.removeEventListener("abort", abort); stream.close(); });
      });
      completed = await this.execution(submitted.execution_id, signal);
      if (completed.operation_id !== submitted.operation_id || JSON.stringify(Object.entries(completed.context).sort()) !== JSON.stringify(Object.entries(submitted.context).sort())) throw new Error("Core completed execution context differs");
      options.onExecution?.(completed);
    }
    if (completed.state === "failed" || completed.state === "cancelled") throw new MachineOperationFailure(completed);
    if (completed.state !== "succeeded") throw new Error("Core did not confirm a completed execution");
    return completed;
  }

  async execution(id: string, signal?: AbortSignal): Promise<MachineExecution> {
    const result = await this.transport.request({ ...resolveMachineBinding(this.discovery, "execution", { execution_id: id }), signal: this.signal(signal) }, decodeMachineExecution);
    if (result.execution_id !== id) throw new Error("Core returned another execution");
    return result;
  }

  watchExecution(execution: MachineExecution, onEvent: (event: MachineEvent) => void, onError: (error: Error) => void): StreamHandle {
    this.signal();
    const binding = resolveMachineBinding(this.discovery, "execution_events", { execution_id: execution.execution_id });
    if (binding.protocol !== "sse" || binding.method !== "GET") throw new Error("Core execution event binding is incompatible");
    let previous = 0;
    const stream = openDiscoveredEventStream({ href: binding.href, protocol: "sse" }, message => {
      const event = decodeMachineEvent(JSON.parse(message.data));
      if (event.execution_id !== execution.execution_id || event.operation_id !== execution.operation_id || event.sequence <= previous || message.lastEventId !== String(event.sequence) || message.type !== event.kind) throw new Error("Core execution event correlation or order differs");
      previous = event.sequence;
      onEvent(event);
    }, onError, this.transport);
    this.streams.add(stream);
    void stream.done.finally(() => this.streams.delete(stream));
    return stream;
  }
}
