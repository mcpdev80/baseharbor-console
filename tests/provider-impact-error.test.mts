import assert from "node:assert/strict";
import test from "node:test";
import { decodeMachineError, decodeMachineExecution, decodeMachineEvent } from "../src/lib/baseharbor/machine-wire.ts";

const details = { version: "baseharbor.provider-impact/v1", target: "owned", revision: "r1", plan_id: "current-plan", complete: false, attention: "Achtung", confirmations_required: 2, destructive: false, impacts: [] };
const error = { code: "policy_denied", cause: "provider_change_consent_required", message: "Acknowledge the current plan", retryable: true, details };
const execution = { contract_version: "v1", execution_id: "exec_" + "0".repeat(32), operation_id: "apply", actor: { mode: "operator" }, context: { target: "owned", environment: "dev", application: "app" }, state: "failed", error };

test("Core provider impact survives typed errors, failed execution and failed events without becoming success", () => {
  assert.deepEqual(decodeMachineError(error).details, details);
  const decoded = decodeMachineExecution(execution);
  assert.equal(decoded.state, "failed");
  assert.deepEqual(decoded.error?.details, details);
  assert.ok(Object.isFrozen(decoded.error?.details));
  assert.ok(Object.isFrozen(decoded.error?.details?.impacts));
  assert.deepEqual(decodeMachineEvent({ ...execution, sequence: 1, occurred_at: "2026-10-11T00:00:00Z", kind: "operation.failed" }).error?.details, details);
});

test("malformed or oversized nesting in error details cannot bypass the bounded wire decoder", () => {
  for (const malformed of [null, [], "plan", 1, true]) assert.throws(() => decodeMachineError({ ...error, details: malformed }));
  let nested: unknown = {};
  for (let i = 0; i < 66; i++) nested = { child: nested };
  assert.throws(() => decodeMachineError({ ...error, details: nested }), /nesting bound/);
  assert.throws(() => decodeMachineError({ ...error, unknown: true }), /Unknown Core machine field/);
});
