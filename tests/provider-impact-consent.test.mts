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

const scope = { version: "baseharbor.provider-impact-scope/v1", plan_id: "a".repeat(64), complete: false, destructive: false, attention: "Achtung", confirmations_required: 2, owner: { owner: "application-deployment", reference: "/protected/deployment.json", subject: "22222222-2222-4222-8222-222222222222", revision: "b".repeat(64) }, targets: [details] };
const stopWire = { ...wire, operation_id: "app.stop", error: { ...wire.error, details: { scope, functions: [], materials: [] } } };
test("App stop acknowledges the outer current scope and preserves independent stages", () => {
 const plan = applicationImpactAcknowledgement(decodeMachineExecution(stopWire), "app.stop", selected,scope.owner.subject);
 assert.ok(plan); assert.equal(plan.plan_id,scope.plan_id);
 assert.equal(impactConsentInput(plan,acknowledged,session),null,"leaf consent must not authorize the whole stop");
 const draft = { ...acknowledged,plan_id:scope.plan_id };
 assert.equal(impactConsentInput(plan,{...draft,first:false},session),null);
 assert.equal(impactConsentInput(plan,{...draft,second:false},session),null);
 assert.equal(impactConsentInput(plan,draft,{}),null);
 assert.deepEqual(impactConsentInput(plan,draft,session),{plan_id:scope.plan_id,first:true,second:true,delete_data:false});
 const newer = applicationImpactAcknowledgement(decodeMachineExecution({...stopWire,error:{...stopWire.error,details:{...stopWire.error.details,scope:{...scope,plan_id:"c".repeat(64)}}}}),"app.stop",selected,scope.owner.subject);
 assert.equal(impactConsentInput(newer,draft,session),null);
});
test("App stop refuses incomplete, foreign, contradictory and wrong-operation scopes", () => {
 for(const changed of [
  {...scope,version:"v2"}, {...scope,plan_id:""}, {...scope,owner:{...scope.owner,owner:"connector-enrollment"}},
  {...scope,owner:{...scope.owner,revision:""}}, {...scope,targets:[]}, {...scope,targets:[details,details]},
  {...scope,targets:[{...details,target:"foreign"}]}, {...scope,confirmations_required:1},
  {...scope,complete:true}, {...scope,destructive:true}, {...scope,targets:[{...details,version:"v2"}]}
 ]) {
  const bad = decodeMachineExecution({...stopWire,error:{...stopWire.error,details:{scope:changed}}});
  assert.equal(applicationImpactAcknowledgement(bad,"app.stop",selected,scope.owner.subject),null);
 }
 assert.equal(applicationImpactAcknowledgement(decodeMachineExecution({...stopWire,error:{...stopWire.error,details}}),"app.stop",selected,scope.owner.subject),null);
 assert.equal(applicationImpactAcknowledgement(decodeMachineExecution({...stopWire,operation_id:"destroy"}),"destroy",selected),null);
 for(const key of ["target","application","environment"] as const) {
  assert.equal(applicationImpactAcknowledgement(decodeMachineExecution(stopWire),"app.stop",{...selected,[key]:"foreign"},scope.owner.subject),null);
 }
});

test("App stop scope cannot acknowledge another deployment on the same selected target", () => {
 const execution = decodeMachineExecution(stopWire);
 assert.equal(applicationImpactAcknowledgement(execution,"app.stop",selected),null);
 assert.equal(applicationImpactAcknowledgement(execution,"app.stop",selected,"foreign-deployment"),null);
});
