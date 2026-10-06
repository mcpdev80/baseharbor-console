import type { MachineExecution } from "./machine-wire.ts";

export function verifiedManagedRotation(execution: MachineExecution): boolean {
  if (execution.operation_id !== "openbao.rotate" || execution.state !== "succeeded" ||
      !execution.context.target || !execution.context.environment) return false;
  const value = execution.result;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const result = value as Record<string, unknown>;
  return result.initialized === true && result.unsealed === true && result.manager_ready === true;
}
