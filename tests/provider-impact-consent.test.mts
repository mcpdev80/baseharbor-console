import assert from "node:assert/strict";
import test from "node:test";
import { applicationImpactAcknowledgement, impactConsentInput } from "../src/lib/baseharbor/provider-impact-consent.ts";
import { decodeMachineExecution } from "../src/lib/baseharbor/machine-wire.ts";

const selected = { application: "app", environment: "dev", target: "owned" };
const details = { version: "baseharbor.provider-impact/v1", target: "owned", revision: "r1", plan_id: "current-plan", complete: false, attention: "Achtung", confirmations_required: 2, destructive: false, impacts: [] };
const wire = { contract_version: "v1", execution_id: "exec_" + "0".repeat(32), operation_id: "apply", actor: { mode: "operator", subject: "owner" }, context: selected, state: "failed", error: { code: "approval_required", cause: "impact-confirmation-required", message: "Review the current plan", details } };
const session = {};
const acknowledged = { session, plan_id: details.plan_id, first: true, second: true, delete_data: false };

test("both stages are explicit, bound to Core's current refusal and never imply data deletion", () => {
  const plan = applicationImpactAcknowledgement(decodeMachineExecution(wire), "apply", selected);
  assert.ok(plan);
  assert.equal(impactConsentInput(plan, null, session), null);
  assert.equal(impactConsentInput(plan, { ...acknowledged, first: false }, session), null);
  assert.equal(impactConsentInput(plan, { ...acknowledged, second: false }, session), null);
  assert.deepEqual(impactConsentInput(plan, acknowledged, session), { plan_id: details.plan_id, first: true, second: true, delete_data: false });
  const destructive = applicationImpactAcknowledgement(decodeMachineExecution({ ...wire, error: { ...wire.error, details: { ...details, destructive: true } } }), "apply", selected);
  assert.equal(impactConsentInput(destructive, acknowledged, session), null);
  assert.equal(impactConsentInput(destructive, { ...acknowledged, delete_data: true }, session)?.delete_data, true);
  const oneStage = applicationImpactAcknowledgement(decodeMachineExecution({ ...wire, error: { ...wire.error, details: { ...details, confirmations_required: 1 } } }), "apply", selected);
  assert.equal(impactConsentInput(oneStage, { ...acknowledged, second: false }, session)?.first, true);
});

test("changed sessions, plans, operations and context cannot reuse acknowledgements", () => {
  const execution = decodeMachineExecution(wire);
  const plan = applicationImpactAcknowledgement(execution, "apply", selected);
  assert.equal(impactConsentInput(plan, acknowledged, {}), null);
  assert.equal(impactConsentInput(plan, { ...acknowledged, plan_id: "old" }, session), null);
  assert.equal(applicationImpactAcknowledgement(execution, "destroy", selected), null);
  for (const key of ["application", "environment", "target"] as const) {
    assert.equal(applicationImpactAcknowledgement(execution, "apply", { ...selected, [key]: "other" }), null);
  }
  assert.equal(applicationImpactAcknowledgement({ ...execution, state: "running" }, "apply", selected), null);
  assert.equal(applicationImpactAcknowledgement({ ...execution, error: { ...execution.error!, code: "provider_failed" } }, "apply", selected), null);
  for (const malformed of [{ ...details, target: "other" }, { ...details, plan_id: "" }, { ...details, version: "v2" }, { ...details, confirmations_required: 0 }, { ...details, confirmations_required: "2" }, { ...details, destructive: "true" }]) {
    assert.equal(applicationImpactAcknowledgement({ ...execution, error: { ...execution.error!, details: malformed } }, "apply", selected), null);
  }
});
