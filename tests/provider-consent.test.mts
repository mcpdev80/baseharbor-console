import test from "node:test";
import assert from "node:assert/strict";
import { decodeMachineError } from "../src/lib/baseharbor/machine-wire.ts";
import type { MachineExecution } from "../src/lib/baseharbor/machine-wire.ts";
import { readProviderImpact, providerConsent, providerImpactForExecution, emptyProviderAcknowledgements } from "../src/lib/baseharbor/provider-consent.ts";
const leaf = { version: "baseharbor.provider-impact/v1", target: "local", revision: "current", plan_id: "a".repeat(64), complete: false, confirmations_required: 2, destructive: false, impacts: [{ action: "create" }] };
const scope = { scope: { version: "baseharbor.provider-impact-scope/v1", owner: { owner: "application-deployment", reference: "/owned/deployment.json", subject: "deployment-a", revision: "current" }, plan_id: "b".repeat(64), complete: true, confirmations_required: 2, destructive: true, targets: [leaf] }, effects: [] };
const context = { application: "app", environment: "dev", target: "local" };
const failure = { state: "failed", operation_id: "apply", context, error: { code: "approval_required", cause: "impact-confirmation-required", message: "review", details: leaf } } as unknown as MachineExecution;

test("typed error details survive decoding immutably; malformed details fail", () => {
  const error = decodeMachineError(JSON.parse(JSON.stringify(failure.error)));
  assert.deepEqual(error.details, leaf);
  assert.ok(Object.isFrozen(error.details)); assert.ok(Object.isFrozen(error.details?.impacts));
  for (const details of [null, [], "plan", 1]) assert.throws(() => decodeMachineError({ code: "approval_required", message: "review", details }));
});

test("incomplete real plans require all explicit stages; generic approval cannot grant consent", () => {
  const review = readProviderImpact(leaf, "local")!;
  assert.equal(review.planId, leaf.plan_id);
  assert.equal(providerConsent(review, emptyProviderAcknowledgements), null);
  assert.equal(providerConsent(review, { first: true, second: false, deleteData: true }), null);
  assert.deepEqual(providerConsent(review, { first: true, second: true, deleteData: true }), { plan_id: leaf.plan_id, first: true, second: true, delete_data: false });
  assert.deepEqual(providerConsent(readProviderImpact({ ...leaf, confirmations_required: 1 }, "local")!, { first: true, second: false, deleteData: false }), { plan_id: leaf.plan_id, first: true, second: false, delete_data: false });
});

test("destroy uses exact current outer scope and a separate data acknowledgement", () => {
  const review = readProviderImpact(scope, "local")!;
  assert.equal(review.planId, scope.scope.plan_id);
  assert.equal(providerConsent(review, { first: true, second: true, deleteData: false }), null);
  assert.deepEqual(providerConsent(review, { first: true, second: true, deleteData: true }), { plan_id: scope.scope.plan_id, first: true, second: true, delete_data: true });
  assert.equal(readProviderImpact({ scope: { ...scope.scope, owner: { ...scope.scope.owner, owner: "installation.destroy" } } }, "local"), null);
});

test("wrong targets, malformed or unknown plans and unsupported operations fail closed", () => {
  for (const details of [null, {}, { ...leaf, version: "future" }, { ...leaf, plan_id: "invented" }, { ...leaf, confirmations_required: 3 }, { ...leaf, target: "foreign" }, { ...leaf, impacts: null }, { scope: { ...scope.scope, targets: [{ ...leaf, target: "foreign" }] } }]) assert.equal(readProviderImpact(details, "local"), null);
  assert.ok(providerImpactForExecution(failure, "apply", context));
  for (const change of [{ state: "succeeded" }, { operation_id: "repair" }, { error: { ...failure.error, code: "policy_denied" } }, { error: { ...failure.error, cause: "other" } }, { context: { ...context, application: "other" } }]) assert.equal(providerImpactForExecution({ ...failure, ...change } as MachineExecution, "apply", context), null);
  assert.equal(providerImpactForExecution({ ...failure, operation_id: "repair" }, "repair", context), null);
  const stale = { ...failure, error: { ...failure.error!, code: "conflict", cause: "stale-impact-consent", details: { ...leaf, plan_id: "c".repeat(64) } } };
  assert.equal(providerImpactForExecution(stale, "apply", context)?.planId, "c".repeat(64));
  assert.equal(providerConsent(providerImpactForExecution(stale, "apply", context)!, emptyProviderAcknowledgements), null);
});


test("application sender binds destroy outer scope to its selected deployment", () => {
  const destroyed = { ...failure, operation_id: "destroy", error: { ...failure.error!, details: scope } };
  assert.ok(providerImpactForExecution(destroyed, "destroy", context, "deployment-a"));
  assert.equal(providerImpactForExecution(destroyed, "destroy", context, "foreign-deployment"), null);
  assert.equal(providerImpactForExecution({ ...destroyed, error: { ...destroyed.error, details: leaf } }, "destroy", context, "deployment-a"), null);
  assert.equal(providerImpactForExecution({ ...failure, error: { ...failure.error!, details: scope } }, "apply", context), null);
});
