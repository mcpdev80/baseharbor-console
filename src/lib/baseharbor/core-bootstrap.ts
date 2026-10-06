import type { MachineContext, MachineExecution } from "./machine-wire.ts";

const sameContext = (first: MachineContext, second: MachineContext) =>
  JSON.stringify(Object.entries(first).sort()) === JSON.stringify(Object.entries(second).sort());

// Only Core's explicit pre-bootstrap refusal permits this continuation. An
// interrupted/unknown/partially successful mutation must never be replayed.
export function offersCoreBootstrap(execution: MachineExecution): boolean {
  return execution.operation_id === "apply" && execution.state === "failed" &&
    execution.error?.code === "capability_missing" && execution.error.cause === "core_required" &&
    execution.error.retryable === true && !!execution.context.application &&
    !!execution.context.environment && !!execution.context.target;
}

export function verifiedCoreSetup(execution: MachineExecution): boolean {
  if (execution.operation_id !== "control-plane.up" || execution.state !== "succeeded") return false;
  const value = execution.result;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const result = value as Record<string, unknown>;
  const spec = result.spec as Record<string, unknown> | undefined;
  const capabilities = result.capabilities as Record<string, unknown> | undefined;
  return result.version === "baseharbor.core-installation/v1" && result.ready === true &&
    result.phase === "ready" && typeof result.installation_id === "string" && result.installation_id.length > 0 &&
    !!spec && spec.target === execution.context.target && !!capabilities &&
    ["sql", "secrets", "identity"].every(capability => capabilities[capability] === true);
}

export function canContinueAfterCoreSetup(failed: MachineExecution, selected: MachineContext, setup: MachineExecution): boolean {
  return offersCoreBootstrap(failed) && sameContext(failed.context, selected) && verifiedCoreSetup(setup) &&
    setup.context.target === selected.target && setup.context.environment === selected.environment &&
    !!failed.actor.subject && failed.actor.subject === setup.actor.subject &&
    failed.actor.mode === setup.actor.mode && failed.actor.issuer === setup.actor.issuer;
}
