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
export function applicationImpactAcknowledgement(execution: MachineExecution | null, operation: string, selected: MachineContext | null): ApplicationImpactAcknowledgement | null {
  if (!execution || !selected?.application || !selected.environment || !selected.target || execution.state !== "failed" || execution.operation_id !== operation) return null;
  if (JSON.stringify(Object.entries(execution.context).sort()) !== JSON.stringify(Object.entries(selected).sort())) return null;
  if (!["approval_required", "conflict"].includes(execution.error?.code ?? "") || !["impact-confirmation-required", "stale-impact-consent", "data-deletion-consent-required"].includes(execution.error?.cause ?? "")) return null;
  const plan = execution.error?.details;
  if (!plan || plan.version !== "baseharbor.provider-impact/v1" || plan.target !== selected.target || typeof plan.plan_id !== "string" || !plan.plan_id || typeof plan.revision !== "string" || !plan.revision || typeof plan.complete !== "boolean" || !Array.isArray(plan.impacts) || typeof plan.destructive !== "boolean" || ![1, 2].includes(plan.confirmations_required as number)) return null;
  return { plan_id: plan.plan_id, confirmations_required: plan.confirmations_required as 1 | 2, destructive: plan.destructive };
}

export function impactConsentInput(plan: ApplicationImpactAcknowledgement | null, draft: ImpactAcknowledgements | null, session: object | null): Omit<ImpactAcknowledgements, "session"> | null {
  if (!plan || !draft || draft.session !== session || draft.plan_id !== plan.plan_id || !draft.first || plan.confirmations_required === 2 && !draft.second || plan.destructive && !draft.delete_data) return null;
  return { plan_id: plan.plan_id, first: draft.first, second: plan.confirmations_required === 2 && draft.second, delete_data: plan.destructive && draft.delete_data };
}
