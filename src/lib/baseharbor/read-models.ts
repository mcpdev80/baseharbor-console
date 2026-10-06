// Validated projection of Core-generated read-model shapes. No health,
// permissions, runtime state or fallback data are inferred in this consumer.
import type { MachineContext } from "./machine-wire.ts";
import { MachineSession } from "./machine-session.ts";

export interface DeploymentRow { readonly deployment_id: string; readonly application_id: string; readonly application: string; readonly environment: string; readonly target: string; readonly runtime_provider?: string; readonly state?: string; readonly ready: boolean; readonly source_available: boolean; readonly source_kind?: string; }
export interface TargetRow { readonly name: string; readonly runtime_provider: string; readonly access_reference: string; readonly scope?: string; readonly implicit?: boolean; readonly default?: boolean; readonly active?: boolean; readonly effective?: boolean; }
export interface WorkspaceRow { readonly application: string; readonly manifest: string; readonly source_count: number; readonly sources?: Readonly<Record<string, string>>; }
export interface RuntimeRow { readonly ref: { readonly provider: string; readonly target: string; readonly kind: string; readonly resource_id: string }; readonly display_name?: string; readonly runtime_name?: string; readonly ownership: string; readonly relationship?: Readonly<Record<string, string>>; readonly state?: { readonly desired?: string; readonly observed?: string; readonly health?: string; readonly ready?: boolean }; }
export interface ReadModel<T> { readonly rows: readonly T[]; readonly warnings: readonly string[]; }
function object(value: unknown, fields: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Core returned an incompatible read model");
  const wire = value as Record<string, unknown>;
  if (Object.keys(wire).some(key => !fields.includes(key))) throw new Error("Unknown Core read-model field");
  return wire;
}
function text(value: unknown): string { if (typeof value !== "string" || value.length > 65536) throw new Error("Invalid Core read-model string"); return value; }
function flag(value: unknown): boolean { if (typeof value !== "boolean") throw new Error("Invalid Core read-model flag"); return value; }
function version(wire: Record<string, unknown>, expected = "v1") { if (wire.contract_version !== expected) throw new Error("Unsupported Core read-model contract"); }
function optional(wire: Record<string, unknown>, strings: readonly string[], flags: readonly string[] = []) { for (const key of strings) if (wire[key] !== undefined) text(wire[key]); for (const key of flags) if (wire[key] !== undefined) flag(wire[key]); }
function array(value: unknown): unknown[] { if (!Array.isArray(value) || value.length > 10000) throw new Error("Invalid Core read-model collection"); return value; }
function strings(value: unknown): Readonly<Record<string, string>> { if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length > 10000) throw new Error("Invalid Core read-model map"); return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, value]) => [text(key), text(value)]))); }
function collection<T>(value: unknown, key: string, decode: (row: unknown) => T, warnings = true): ReadModel<T> {
  const wire = object(value, ["contract_version", key, ...(warnings ? ["warnings"] : [])]); version(wire);
  return Object.freeze({ rows: Object.freeze(array(wire[key]).map(decode)), warnings: Object.freeze(wire.warnings === undefined ? [] : array(wire.warnings).map(text)) });
}
export function decodeDeployments(value: unknown): ReadModel<DeploymentRow> { return collection(value, "deployments", value => {
  const wire = object(value, ["contract_version", "deployment_id", "application_id", "application", "environment", "target", "runtime_provider", "state", "ready", "source_kind", "source_available"]); version(wire);
  for (const key of ["deployment_id", "application_id", "application", "environment", "target"]) text(wire[key]);
  flag(wire.ready); flag(wire.source_available); optional(wire, ["runtime_provider", "state", "source_kind"]);
  return Object.freeze({ ...wire }) as unknown as DeploymentRow;
}); }
export function decodeTargets(value: unknown): ReadModel<TargetRow> { return collection(value, "targets", value => {
  const wire = object(value, ["contract_version", "name", "runtime_provider", "access_reference", "scope", "implicit", "default", "active", "effective"]); version(wire);
  for (const key of ["name", "runtime_provider", "access_reference"]) text(wire[key]); optional(wire, ["scope"], ["implicit", "default", "active", "effective"]);
  return Object.freeze({ ...wire }) as unknown as TargetRow;
}, false); }
export function decodeWorkspaces(value: unknown): ReadModel<WorkspaceRow> { return collection(value, "workspaces", value => {
  const wire = object(value, ["contract_version", "application", "manifest", "source_count", "sources"]); version(wire); text(wire.application); text(wire.manifest);
  if (typeof wire.source_count !== "number" || !Number.isSafeInteger(wire.source_count) || wire.source_count < 0) throw new Error("Invalid Core source count");
  return Object.freeze({ ...wire, ...(wire.sources === undefined ? {} : { sources: strings(wire.sources) }) }) as unknown as WorkspaceRow;
}); }
export function decodeRuntime(value: unknown, target: string): ReadModel<RuntimeRow> {
  const rows = (value === null ? [] : array(value)).map(value => {
    const wire = object(value, ["contract_version", "ref", "display_name", "runtime_name", "ownership", "relationship", "state", "created_at", "updated_at", "references", "reconciliation", "extension"]); version(wire, "baseharbor.runtime-explorer/v1");
    const ref = object(wire.ref, ["provider", "target", "kind", "resource_id"]); for (const key of ["provider", "target", "kind", "resource_id"]) { if (!text(ref[key]).trim()) throw new Error("Incomplete Core runtime identity"); }
    if (ref.target !== target || !["container", "image", "volume", "network", "pod"].includes(String(ref.kind))) throw new Error("Runtime resource differs from the selected target or kind");
    if (!["managed", "external", "unmanaged", "platform"].includes(String(wire.ownership))) throw new Error("Unknown Core runtime ownership");
    optional(wire, ["display_name", "runtime_name", "created_at", "updated_at"]);
    const relationship = wire.relationship === undefined ? undefined : strings(object(wire.relationship, ["application_id", "deployment_id", "application", "environment", "component", "provider"]));
    if (wire.ownership === "managed" && !relationship?.application_id && !relationship?.deployment_id && !relationship?.provider) throw new Error("Managed Core resource has no ownership relationship");
    const state = wire.state === undefined ? undefined : object(wire.state, ["desired", "observed", "health", "ready"]); if (state) optional(state, ["desired", "observed", "health"], ["ready"]);
    if (wire.references !== undefined) strings(wire.references);
    if (wire.reconciliation !== undefined) { const hint = object(wire.reconciliation, ["preferred_operation", "direct_mutation_may_be_reconciled", "detail"]); optional(hint, ["preferred_operation", "detail"], ["direct_mutation_may_be_reconciled"]); }
    return Object.freeze({ ref: Object.freeze({ ...ref }), ownership: wire.ownership, display_name: wire.display_name, runtime_name: wire.runtime_name, ...(relationship ? { relationship } : {}), ...(state ? { state: Object.freeze({ ...state }) } : {}) }) as unknown as RuntimeRow;
  });
  return Object.freeze({ rows: Object.freeze(rows), warnings: Object.freeze([]) });
}
export class LiveCoreAdapter {
  private readonly session: MachineSession;
  constructor(session: MachineSession) { this.session = session; }
  private async read<T>(operation: string, context: MachineContext, decode: (result: unknown) => T, signal?: AbortSignal): Promise<T> {
    const advertised = this.session.discovery.operations.find(item => item.id === operation);
    if (!advertised || advertised.safety !== "read_only") throw new Error("Core did not advertise the selected read capability");
    return decode((await this.session.run(operation, context, {}, { signal })).result);
  }
  applications(context: MachineContext, signal?: AbortSignal) { return this.read("app.list", context, decodeDeployments, signal); }
  targets(context: MachineContext, signal?: AbortSignal) { return this.read("target.list", context, decodeTargets, signal); }
  workspaces(context: MachineContext, signal?: AbortSignal) { return this.read("workspace.list", context, decodeWorkspaces, signal); }
  runtime(context: MachineContext, signal?: AbortSignal) { if (!context.target?.trim()) throw new Error("Select a Core target"); return this.read("runtime.list", context, value => decodeRuntime(value, context.target!), signal); }
}

export interface RuntimeCapabilities { readonly provider: string; readonly target: string; readonly capabilities: readonly string[]; readonly resource_kinds: readonly string[]; }
export function decodeRuntimeCapabilities(value: unknown, target: string): RuntimeCapabilities {
  const wire = object(value, ["contract_version", "provider", "target", "capabilities", "resource_kinds"]); version(wire, "baseharbor.runtime-explorer/v1");
  const provider = text(wire.provider); if (!provider.trim() || text(wire.target) !== target) throw new Error("Runtime capabilities differ from the selected target");
  return Object.freeze({ provider, target, capabilities: Object.freeze(array(wire.capabilities).map(text)), resource_kinds: Object.freeze(array(wire.resource_kinds).map(text)) });
}
