import { decodeMachineActor, decodeMachineContext } from "./machine-wire.ts";
import type { MachineActor, MachineContext } from "./machine-wire.ts";

export interface TerminalDescriptor { readonly stream_id: string; readonly actor: MachineActor; readonly context: MachineContext; readonly resource_kind: string; readonly resource_id: string; }
export interface TerminalEvent { readonly sequence: number; readonly kind: "terminal.ready" | "terminal.output" | "terminal.exit"; readonly data?: Uint8Array; readonly exit_code?: number; }
function object(value: unknown, fields: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid Core terminal object");
  const wire = value as Record<string, unknown>;
  if (Object.keys(wire).some(key => !fields.includes(key))) throw new Error("Unknown Core terminal field");
  return wire;
}
function date(value: unknown): void { if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error("Invalid Core terminal timestamp"); }
export function decodeTerminalDescriptor(value: unknown, context: MachineContext, resourceKind: string, resourceId: string): TerminalDescriptor {
  const wire = object(value, ["contract_version", "stream_id", "kind", "actor", "context", "resource_kind", "resource_id", "created_at"]);
  if (wire.contract_version !== "v1" || wire.kind !== "exec" || typeof wire.stream_id !== "string" || !/^stream_[0-9a-f]{32}$/.test(wire.stream_id) || wire.resource_kind !== resourceKind || wire.resource_id !== resourceId) throw new Error("Core terminal resource or contract differs");
  const scope = decodeMachineContext(wire.context); if (Object.entries(context).some(([key, value]) => scope[key as keyof MachineContext] !== value)) throw new Error("Core terminal scope differs");
  const actor = decodeMachineActor(wire.actor); if (actor.mode !== "authenticated" || !actor.issuer || !actor.subject) throw new Error("Core terminal has no verified operator");
  date(wire.created_at);
  return Object.freeze({ stream_id: wire.stream_id, actor, context: scope, resource_kind: resourceKind, resource_id: resourceId });
}
export function decodeTerminalEvent(value: unknown, streamId: string): TerminalEvent {
  const wire = object(value, ["contract_version", "stream_id", "sequence", "kind", "occurred_at", "data", "exit_code"]);
  if (wire.contract_version !== "v1" || wire.stream_id !== streamId || typeof wire.sequence !== "number" || !Number.isSafeInteger(wire.sequence) || wire.sequence < 1) throw new Error("Core terminal identity or sequence differs");
  date(wire.occurred_at);
  if (wire.kind === "terminal.output") {
    if (wire.exit_code !== undefined || typeof wire.data !== "string" || !wire.data || wire.data.length > 21848 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(wire.data)) throw new Error("Invalid bounded terminal output");
    const binary = atob(wire.data); if (binary.length > 16384 || btoa(binary) !== wire.data) throw new Error("Invalid terminal binary encoding");
    return Object.freeze({ sequence: wire.sequence, kind: wire.kind, data: Uint8Array.from(binary, value => value.charCodeAt(0)) });
  }
  if (wire.data !== undefined || wire.kind !== "terminal.ready" && wire.kind !== "terminal.exit") throw new Error("Invalid terminal event kind or payload");
  if (wire.kind === "terminal.ready" && wire.exit_code !== undefined) throw new Error("Terminal ready cannot carry an exit");
  if (wire.kind === "terminal.exit" && (typeof wire.exit_code !== "number" || !Number.isSafeInteger(wire.exit_code))) throw new Error("Terminal exit requires an integer status");
  return Object.freeze({ sequence: wire.sequence, kind: wire.kind, ...(wire.exit_code === undefined ? {} : { exit_code: wire.exit_code as number }) });
}
export function validateTerminalSize(rows: number, columns: number): void { if (![rows, columns].every(value => Number.isSafeInteger(value) && value >= 1 && value <= 512)) throw new Error("Terminal size must be between 1 and 512"); }
