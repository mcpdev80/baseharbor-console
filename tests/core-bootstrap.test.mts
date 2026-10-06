import test from "node:test";
import assert from "node:assert/strict";
import { offersCoreBootstrap, verifiedCoreSetup, canContinueAfterCoreSetup } from "../src/lib/baseharbor/core-bootstrap.ts";
import type { MachineExecution } from "../src/lib/baseharbor/machine-wire.ts";

const selected = { application: "first-app", environment: "dev", target: "local" };
const actor = { mode: "oidc", issuer: "https://identity.example", subject: "operator" };
const failed = { operation_id: "apply", state: "failed", context: selected, actor,
  error: { code: "capability_missing", cause: "core_required", retryable: true, message: "Core required" } } as unknown as MachineExecution;
const setup = { operation_id: "control-plane.up", state: "succeeded", context: { environment: "dev", target: "local" }, actor,
  result: { version: "baseharbor.core-installation/v1", installation_id: "installation-a", phase: "ready", ready: true,
    spec: { target: "local" }, capabilities: { sql: true, secrets: true, identity: true } } } as unknown as MachineExecution;

test("only the explicit failed Core-required apply offers first-application bootstrap", () => {
  assert.equal(offersCoreBootstrap(failed), true);
  for (const change of [{ state: "running" }, { state: "cancelled" }, { operation_id: "destroy" },
    { error: { ...failed.error, cause: "connection_lost" } }, { error: { ...failed.error, retryable: false } },
    { context: { environment: "dev", target: "local" } }]) assert.equal(offersCoreBootstrap({ ...failed, ...change } as MachineExecution), false);
});

test("continuation requires verified SQL/Secrets/Identity and the exact target", () => {
  assert.equal(verifiedCoreSetup(setup), true);
  assert.equal(canContinueAfterCoreSetup(failed, selected, setup), true);
  const result = setup.result as Record<string, unknown>;
  for (const change of [{ ready: false }, { phase: "identity_failed" }, { capabilities: { sql: true, secrets: true } },
    { spec: { target: "foreign" } }, { installation_id: "" }]) {
    assert.equal(canContinueAfterCoreSetup(failed, selected, { ...setup, result: { ...result, ...change } }), false);
  }
  assert.equal(verifiedCoreSetup({ ...setup, state: "failed" }), false);
});

test("changing selection or authenticated actor after bootstrap prevents automatic continuation", () => {
  for (const context of [{ ...selected, target: "foreign" }, { ...selected, application: "other-app" }, { ...selected, environment: "prod" }])
    assert.equal(canContinueAfterCoreSetup(failed, context, setup), false);
  for (const change of [{ subject: "other-operator" }, { issuer: "https://foreign.example" }, { mode: "other" }])
    assert.equal(canContinueAfterCoreSetup(failed, selected, { ...setup, actor: { ...actor, ...change } }), false);
  assert.equal(canContinueAfterCoreSetup(failed, selected, { ...setup, context: { target: "local", environment: "prod" } }), false);
});
