import type { MachineContext, MachineExecution } from "./machine-wire.ts";

export interface ApplicationImpactAcknowledgement {
  readonly plan_id: string;
  readonly confirmations_required: 1 | 2;
  readonly destructive: boolean;
}
export interface ImpactAcknowledgements {
  readonly session: object;
  readonly plan_id: string;
  readonly first: boolean;
  readonly second: boolean;
  readonly delete_data: boolean;
}

// Display and acknowledge only Core's explicit refusal for this selection.
// Core revalidates the authoritative plan when the user submits again.
export function applicationImpactAcknowledgement(execution: MachineExecution | null, operation: string, selected: MachineContext | null, deploymentID?: string): ApplicationImpactAcknowledgement | null {
  if (!execution || !selected?.application || !selected.environment || !selected.target || execution.state !== "failed" || execution.operation_id !== operation) return null;
  if (JSON.stringify(Object.entries(execution.context).sort()) !== JSON.stringify(Object.entries(selected).sort())) return null;
  if (!["approval_required", "conflict"].includes(execution.error?.code ?? "") || !["impact-confirmation-required", "stale-impact-consent", "data-deletion-consent-required"].includes(execution.error?.cause ?? "")) return null;
  const plan = execution.error?.details;
  if (operation === "app.stop") return applicationStopScopeAcknowledgement(plan?.scope, selected.target, deploymentID);
  if (!providerImpactPlan(plan, selected.target)) return null;
  return { plan_id: plan.plan_id, confirmations_required: plan.confirmations_required as 1 | 2, destructive: plan.destructive };
}

function record(value: unknown): Readonly<Record<string, unknown>> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Readonly<Record<string, unknown>> : null;
}
function providerImpactPlan(value: unknown, target: string): value is Readonly<Record<string, unknown>> & { plan_id: string; destructive: boolean; complete: boolean; confirmations_required: 1 | 2 } {
  const plan = record(value);
  return !!plan && plan.version === "baseharbor.provider-impact/v1" && plan.target === target && typeof plan.plan_id === "string" && !!plan.plan_id && typeof plan.revision === "string" && !!plan.revision && typeof plan.complete === "boolean" && Array.isArray(plan.impacts) && typeof plan.destructive === "boolean" && [1, 2].includes(plan.confirmations_required as number);
}
// The outer plan authorizes the entire concrete stop; a leaf acknowledgement
// cannot approve its workload and recovery-owner consequences. It is accepted
// only for this failed selected App stop, never another mutation or node owner.
function applicationStopScopeAcknowledgement(value: unknown, target: string, deploymentID?: string): ApplicationImpactAcknowledgement | null {
  const scope = record(value), owner = record(scope?.owner);
  if (!scope || scope.version !== "baseharbor.provider-impact-scope/v1" || typeof scope.plan_id !== "string" || !/^[0-9a-f]{64}$/.test(scope.plan_id) || typeof scope.complete !== "boolean" || typeof scope.destructive !== "boolean" || ![1, 2].includes(scope.confirmations_required as number)) return null;
  if (!deploymentID || !owner || owner.subject !== deploymentID || owner.owner !== "application-deployment" || typeof owner.reference !== "string" || !owner.reference.trim() || typeof owner.subject !== "string" || !owner.subject.trim() || typeof owner.revision !== "string" || !/^[0-9a-f]{64}$/.test(owner.revision)) return null;
  if (!Array.isArray(scope.targets) || scope.targets.length !== 1 || !providerImpactPlan(scope.targets[0], target)) return null;
  const leaf = scope.targets[0];
  if ((scope.confirmations_required as number) < leaf.confirmations_required || scope.destructive !== leaf.destructive || scope.complete && !leaf.complete) return null;
  if ((!scope.complete || scope.destructive || scope.attention) && scope.confirmations_required !== 2) return null;
  return { plan_id: scope.plan_id, confirmations_required: scope.confirmations_required as 1 | 2, destructive: scope.destructive };
}

export function impactConsentInput(plan: ApplicationImpactAcknowledgement | null, draft: ImpactAcknowledgements | null, session: object | null): Omit<ImpactAcknowledgements, "session"> | null {
  if (!plan || !draft || draft.session !== session || draft.plan_id !== plan.plan_id || !draft.first || plan.confirmations_required === 2 && !draft.second || plan.destructive && !draft.delete_data) return null;
  return { plan_id: plan.plan_id, first: draft.first, second: plan.confirmations_required === 2 && draft.second, delete_data: plan.destructive && draft.delete_data };
}
