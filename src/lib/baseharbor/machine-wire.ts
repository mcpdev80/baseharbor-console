// Consumer of the immutable public Core machine control v1 envelope.
// Authentication and authorization are Core decisions; these are wire checks.
export type ExecutionState = "pending" | "running" | "succeeded" | "failed" | "cancelled";
export interface MachineContext { readonly application?: string; readonly environment?: string; readonly target?: string; readonly workspace?: string; readonly resource?: string; }
export interface MachineActor { readonly mode: string; readonly issuer?: string; readonly subject?: string; readonly assurance?: string; readonly authentication_methods?: readonly string[]; }
export interface MachineError { readonly code: string; readonly message: string; readonly cause?: string; readonly retryable?: boolean; readonly next?: string; readonly resource?: string; readonly remediation_class?: string; }
export interface MachineProgress { readonly stage?: string; readonly message?: string; readonly current?: number; readonly total?: number; readonly percent?: number; }
export interface MachineExecution {
  readonly contract_version: "v1"; readonly execution_id: string; readonly operation_id: string;
  readonly actor: MachineActor; readonly context: MachineContext; readonly state: ExecutionState;
  readonly started_at?: string; readonly finished_at?: string; readonly progress?: MachineProgress;
  readonly result?: unknown; readonly error?: MachineError;
}
export interface MachineEvent {
  readonly contract_version: "v1"; readonly sequence: number; readonly occurred_at: string; readonly kind: string;
  readonly execution_id?: string; readonly operation_id?: string; readonly actor?: MachineActor; readonly context?: MachineContext;
  readonly state?: ExecutionState; readonly progress?: MachineProgress; readonly result?: unknown; readonly error?: MachineError;
  readonly resource_kind?: string; readonly resource_id?: string;
}
const states = new Set(["pending", "running", "succeeded", "failed", "cancelled"]);
const kinds = new Set(["operation.started", "operation.progress", "operation.succeeded", "operation.failed", "operation.cancelled", "application.state", "provider.state", "target.state", "runtime.resource"]);
function object(value: unknown, fields: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid Core machine object");
  const wire = value as Record<string, unknown>;
  if (Object.keys(wire).some(key => !fields.includes(key))) throw new Error("Unknown Core machine field");
  return wire;
}
function text(value: unknown, max = 4096): string {
  if (typeof value !== "string" || value.length > max) throw new Error("Invalid Core machine string");
  return value;
}
function optionalText(wire: Record<string, unknown>, key: string, max = 4096): void { if (wire[key] !== undefined) text(wire[key], max); }
function date(value: unknown): void {
  const valueText = text(value);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(valueText) || !Number.isFinite(Date.parse(valueText))) throw new Error("Invalid Core machine timestamp");
}
function identity(value: unknown): void { if (!/^exec_[0-9a-f]{32}$/.test(text(value, 37))) throw new Error("Invalid Core execution identity"); }
function operation(value: unknown): void { if (!/^[a-z][a-z0-9_.-]*$/.test(text(value, 256))) throw new Error("Invalid Core operation identity"); }
function deepFreeze(value: unknown, depth = 0): void {
  if (depth > 64) throw new Error("Core result exceeds nesting bound");
  if (value && typeof value === "object") { for (const item of Object.values(value)) deepFreeze(item, depth + 1); Object.freeze(value); }
}
export function decodeMachineContext(value: unknown): MachineContext {
  const wire = object(value, ["application", "environment", "target", "workspace", "resource"]);
  for (const key of Object.keys(wire)) text(wire[key]);
  return Object.freeze({ ...wire }) as MachineContext;
}
export function decodeMachineActor(value: unknown): MachineActor {
  const wire = object(value, ["mode", "issuer", "subject", "assurance", "authentication_methods"]);
  text(wire.mode, 256); optionalText(wire, "issuer"); optionalText(wire, "subject"); optionalText(wire, "assurance", 256);
  if (wire.authentication_methods !== undefined) {
    if (!Array.isArray(wire.authentication_methods) || wire.authentication_methods.length > 128) throw new Error("Invalid Core actor methods");
    for (const method of wire.authentication_methods) text(method, 256);
  }
  deepFreeze(wire); return wire as unknown as MachineActor;
}
export function decodeMachineError(value: unknown): MachineError {
  const wire = object(value, ["code", "message", "cause", "retryable", "next", "resource", "remediation_class"]);
  text(wire.code, 256); text(wire.message, 65536); optionalText(wire, "cause"); optionalText(wire, "next", 65536); optionalText(wire, "resource"); optionalText(wire, "remediation_class", 256);
  if (wire.retryable !== undefined && typeof wire.retryable !== "boolean") throw new Error("Invalid Core retry flag");
  return Object.freeze({ ...wire }) as unknown as MachineError;
}
function progress(value: unknown): MachineProgress {
  const wire = object(value, ["stage", "message", "current", "total", "percent"]);
  optionalText(wire, "stage"); optionalText(wire, "message", 65536);
  for (const key of ["current", "total", "percent"]) if (wire[key] !== undefined && (typeof wire[key] !== "number" || !Number.isFinite(wire[key]) || (key !== "percent" && !Number.isSafeInteger(wire[key])))) throw new Error("Invalid Core progress number");
  return Object.freeze({ ...wire }) as MachineProgress;
}
function common(wire: Record<string, unknown>): void {
  if (wire.contract_version !== "v1") throw new Error("Unsupported Core machine version");
  if (wire.execution_id !== undefined) identity(wire.execution_id);
  if (wire.operation_id !== undefined) operation(wire.operation_id);
  if (wire.state !== undefined && (typeof wire.state !== "string" || !states.has(wire.state))) throw new Error("Unknown Core execution state");
  if (wire.actor !== undefined) decodeMachineActor(wire.actor);
  if (wire.context !== undefined) decodeMachineContext(wire.context);
  if (wire.progress !== undefined) progress(wire.progress);
  if (wire.error !== undefined) decodeMachineError(wire.error);
  deepFreeze(wire);
}
export function decodeMachineExecution(value: unknown): MachineExecution {
  const wire = object(value, ["contract_version", "execution_id", "operation_id", "actor", "context", "state", "started_at", "finished_at", "progress", "result", "error"]);
  identity(wire.execution_id); operation(wire.operation_id); decodeMachineActor(wire.actor); decodeMachineContext(wire.context);
  if (typeof wire.state !== "string" || !states.has(wire.state)) throw new Error("Unknown Core execution state");
  for (const key of ["started_at", "finished_at"]) if (wire[key] !== undefined) date(wire[key]);
  if (wire.state === "succeeded" && !Object.hasOwn(wire, "result")) throw new Error("Core success lacks a structured result");
  if (wire.state === "failed" && wire.error === undefined) throw new Error("Core failure lacks a typed error");
  common(wire); return wire as unknown as MachineExecution;
}
export function decodeMachineEvent(value: unknown): MachineEvent {
  const wire = object(value, ["contract_version", "sequence", "occurred_at", "kind", "execution_id", "operation_id", "actor", "context", "state", "progress", "result", "error", "resource_kind", "resource_id"]);
  if (typeof wire.sequence !== "number" || !Number.isSafeInteger(wire.sequence) || wire.sequence < 1) throw new Error("Invalid Core event sequence");
  if (typeof wire.kind !== "string" || !kinds.has(wire.kind)) throw new Error("Unknown Core event kind");
  date(wire.occurred_at); optionalText(wire, "resource_kind", 256); optionalText(wire, "resource_id");
  common(wire); return wire as unknown as MachineEvent;
}
