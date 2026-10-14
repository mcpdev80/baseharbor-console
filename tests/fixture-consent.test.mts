import assert from "node:assert/strict";
import test from "node:test";
import { fixtureConsent, fixtureFailureSummary } from "../scripts/browser/fixture-consent.mjs";

const plan = { version: "baseharbor.provider-impact/v1", plan_id: "a".repeat(64), complete: false, destructive: false, confirmations_required: 2, attention: "Achtung" };
const failure = { contract_version: "v1", error: { code: "approval_required", cause: "impact-confirmation-required", details: plan } };
test("isolated fixture acknowledges actual plan and separates data consent", () => {
 assert.deepEqual(fixtureConsent(failure), { plan_id: plan.plan_id, first: true, second: true, delete_data: false });
 assert.deepEqual(fixtureConsent({ ...failure, error: { ...failure.error, details: { scope: { ...plan, version: "baseharbor.provider-impact-scope/v1", destructive: true } } } }), { plan_id: plan.plan_id, first: true, second: true, delete_data: true });
 for (const changed of [{ ...plan, plan_id: "guessed" }, { ...plan, version: "v2" }, { ...plan, confirmations_required: 1 }, { ...plan, destructive: "yes" }]) assert.throws(() => fixtureConsent({ ...failure, error: { ...failure.error, details: changed } }));
 for (const cause of ["stale-impact-consent", "partial-cleanup", "provider_consumer_inventory_invalid"]) assert.throws(() => fixtureConsent({ ...failure, error: { ...failure.error, cause } }));
});

test("fixture failure diagnostics retain actual classifications without copying secret-bearing output", () => {
 const summary = fixtureFailureSummary({ stdout: JSON.stringify({ results: [{ status: "FAILED", detail: "provider change: stale-impact-consent password=never-copy-this", resource: "/private/owner" }, { status: "SKIPPED" }] }), stderr: JSON.stringify({ error: { code: "internal_error", message: "postgres://user:never-copy-this@private/owner" } }) });
 assert.deepEqual(summary, { code: "internal_error", observed_markers: ["stale-impact-consent"], result_counts: { FAILED: 1, SKIPPED: 1 } });
 for (const value of ["never-copy-this", "private", "password", "postgres"]) assert.ok(!JSON.stringify(summary).includes(value));
 assert.deepEqual(fixtureFailureSummary({ stdout: "arbitrary secret", stderr: "malformed secret" }), { code: "unknown", observed_markers: [], result_counts: {} });
 assert.equal(fixtureFailureSummary({ stderr: JSON.stringify({ error: { code: "secret-code" } }) }).code, "unknown");
});
