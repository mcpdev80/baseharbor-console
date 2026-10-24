import type { MachineContext, MachineExecution } from "./machine-wire.ts";

export interface ProviderImpactReview {
  readonly planId: string;
  readonly confirmations: 1 | 2;
  readonly destructive: boolean;
  readonly details: Readonly<Record<string, unknown>>;
}
export interface ProviderAcknowledgements { readonly first: boolean; readonly second: boolean; readonly deleteData: boolean; }
export const emptyProviderAcknowledgements: ProviderAcknowledgements = Object.freeze({ first: false, second: false, deleteData: false });
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 4096;
const validStages = (value: Record<string, unknown>) => typeof value.plan_id === "string" && /^[a-f0-9]{64}$/.test(value.plan_id) && typeof value.complete === "boolean" &&
  typeof value.destructive === "boolean" && (value.confirmations_required === 1 || value.confirmations_required === 2);
const targetPlan = (value: unknown, target: string): boolean => record(value) &&
  value.version === "baseharbor.provider-impact/v1" && validStages(value) && value.target === target &&
  text(value.revision) && Array.isArray(value.impacts);

// These are wire-shape checks, not a second consequence planner. Incomplete
// knowledge is displayed; Core alone decides which acknowledged plans may run.
export function readProviderImpact(details: unknown, target: string): ProviderImpactReview | null {
  if (!record(details) || !text(target)) return null;
  let plan: Record<string, unknown>;
  if (targetPlan(details, target)) plan = details;
  else {
    const scope = details.scope;
    if (!record(scope) || scope.version !== "baseharbor.provider-impact-scope/v1" || !validStages(scope) ||
      !record(scope.owner) || scope.owner.owner !== "application-deployment" || !["owner", "reference", "subject", "revision"].every(key => text(scope.owner && (scope.owner as Record<string, unknown>)[key])) ||
      !Array.isArray(scope.targets) || !scope.targets.every(value => targetPlan(value, target))) return null;
    plan = scope;
  }
  return Object.freeze({ planId: plan.plan_id as string, confirmations: plan.confirmations_required as 1 | 2,
    destructive: plan.destructive as boolean, details });
}

export function providerConsent(review: ProviderImpactReview, acknowledgements: ProviderAcknowledgements) {
  if (!acknowledgements.first || review.confirmations === 2 && !acknowledgements.second ||
    review.destructive && !acknowledgements.deleteData) return null;
  return { plan_id: review.planId, first: true, second: review.confirmations === 2 && acknowledgements.second,
    delete_data: review.destructive && acknowledgements.deleteData };
}

export function providerImpactForExecution(execution: MachineExecution, operation: string, context: MachineContext, deploymentId?: string): ProviderImpactReview | null {
  if (execution.state !== "failed" || execution.operation_id !== operation || !["apply", "destroy"].includes(operation) ||
    JSON.stringify(Object.entries(execution.context).sort()) !== JSON.stringify(Object.entries(context).sort()) ||
    !["approval_required", "conflict"].includes(execution.error?.code ?? "") ||
    !["impact-confirmation-required", "data-deletion-consent-required", "stale-impact-consent"].includes(execution.error?.cause ?? "")) return null;
  const details = execution.error?.details;
  if (!record(details) || operation === "apply" && !targetPlan(details, context.target ?? "")) return null;
  if (operation === "destroy" && (!record(details.scope) || !record(details.scope.owner) ||
    deploymentId !== undefined && details.scope.owner.subject !== deploymentId)) return null;
  return readProviderImpact(details, context.target ?? "");
}
