import { BaseHarborHttpTransport, resolveCoreDestination } from "./client.ts";
import type { HttpRequestDescriptor } from "./client.ts";

// Canonical bootstrap defined by Core docs/spec/machine-http-v1.md. Every
// subsequent endpoint comes from the authenticated Core discovery document.
const discoveryHref = "/api/v1/machine/discovery";

export interface MachineOperation {
  readonly id: string;
  readonly description: string;
  readonly safety: "read_only" | "mutating" | "destructive";
  readonly confirmation_required: boolean;
  readonly policy_required: boolean;
  readonly contract_version: "v1";
  readonly mcp_tool?: string;
}

export interface MachineBinding {
  readonly href: string;
  readonly method: NonNullable<HttpRequestDescriptor["method"]>;
  readonly protocol?: "sse" | "text";
}

export interface MachineDiscovery {
  readonly contract_version: "v1";
  readonly execution_version: "v1";
  readonly operations: readonly MachineOperation[];
  readonly capabilities: readonly string[];
  readonly http: Readonly<Record<string, MachineBinding>>;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid Core discovery object");
  return value as Record<string, unknown>;
}

function text(value: unknown, max = 4096): string {
  if (typeof value !== "string" || !value || value.length > max) throw new Error("Invalid Core discovery string");
  return value;
}

function flag(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Invalid Core operation safety flag");
  return value;
}

export function decodeMachineDiscovery(value: unknown, coreOrigin: string): MachineDiscovery {
  const wire = object(value);
  if (wire.contract_version !== "v1" || wire.execution_version !== "v1") throw new Error("Unsupported Core machine contract");
  if (!Array.isArray(wire.operations) || wire.operations.length > 2048) throw new Error("Invalid Core operation registry");
  const seen = new Set<string>();
  const operations = wire.operations.map((entry): MachineOperation => {
    const op = object(entry), id = text(op.id, 256);
    if (!/^[a-z][a-z0-9_.-]*$/.test(id) || seen.has(id) || op.contract_version !== "v1") throw new Error("Invalid or duplicate Core operation");
    seen.add(id);
    if (op.safety !== "read_only" && op.safety !== "mutating" && op.safety !== "destructive") throw new Error("Unknown Core operation safety");
    return Object.freeze({ id, description: text(op.description), safety: op.safety,
      confirmation_required: flag(op.confirmation_required), policy_required: flag(op.policy_required),
      contract_version: "v1", ...(op.mcp_tool === undefined ? {} : { mcp_tool: text(op.mcp_tool, 256) }) });
  });
  const capabilities = wire.capabilities ?? [];
  if (!Array.isArray(capabilities) || capabilities.length > 256) throw new Error("Invalid Core capabilities");
  const http: Record<string, MachineBinding> = Object.create(null);
  const entries = Object.entries(object(wire.http));
  if (entries.length > 128) throw new Error("Core endpoint registry exceeds its limit");
  for (const [name, entry] of entries) {
    if (!/^[a-z][a-z0-9_]*$/.test(name)) throw new Error("Invalid Core endpoint name");
    const binding = object(entry), href = text(binding.href, 2048);
    if (!href.startsWith("/") || href.startsWith("//") || /[?#\\]/.test(href)) throw new Error("Invalid Core endpoint path");
    const method = binding.method;
    if (method !== "GET" && method !== "POST" && method !== "PUT" && method !== "PATCH" && method !== "DELETE") throw new Error("Unsupported Core endpoint method");
    if (binding.protocol !== undefined && binding.protocol !== "sse" && binding.protocol !== "text") throw new Error("Unsupported Core endpoint protocol");
    const placeholders = href.match(/\{[^}]*\}/g) ?? [];
    if (placeholders.some(p => p !== "{execution_id}" && p !== "{stream_id}") || /[{}]/.test(href.replace(/\{(?:execution_id|stream_id)\}/g, ""))) throw new Error("Unknown Core endpoint placeholder");
    resolveCoreDestination(href, coreOrigin);
    http[name] = Object.freeze({ href, method, ...(binding.protocol === undefined ? {} : { protocol: binding.protocol }) });
  }
  if (http.execute?.method !== "POST" || http.execution?.method !== "GET" || http.execution_events?.method !== "GET" || http.execution_events?.protocol !== "sse") throw new Error("Core lacks required execution bindings");
  return Object.freeze({ contract_version: "v1", execution_version: "v1", operations: Object.freeze(operations),
    capabilities: Object.freeze(capabilities.map(c => text(c, 256))), http: Object.freeze(http) });
}

export function resolveMachineBinding(discovery: MachineDiscovery, name: string, ids: { execution_id?: string; stream_id?: string } = {}): MachineBinding {
  const binding = discovery.http[name];
  if (!binding) throw new Error("Core did not advertise the requested endpoint");
  const href = binding.href.replace(/\{(execution_id|stream_id)\}/g, (_placeholder, key: "execution_id" | "stream_id") => {
    const id = ids[key], prefix = key === "execution_id" ? "exec" : "stream";
    if (!id || !new RegExp(`^${prefix}_[0-9a-f]{32}$`).test(id)) throw new Error("Invalid Core resource identifier");
    return id;
  });
  return Object.freeze({ ...binding, href });
}

export async function discoverMachine(transport: BaseHarborHttpTransport, coreOrigin: string, signal?: AbortSignal): Promise<MachineDiscovery> {
  return transport.request({ href: discoveryHref, signal }, wire => decodeMachineDiscovery(wire, coreOrigin));
}
