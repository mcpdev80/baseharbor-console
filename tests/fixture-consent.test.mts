import assert from "node:assert/strict";
import test from "node:test";
import { fixtureConsent } from "../scripts/browser/fixture-consent.mjs";

const plan = { version: "baseharbor.provider-impact/v1", plan_id: "a".repeat(64), complete: false, destructive: false, confirmations_required: 2, attention: "Achtung" };
const failure = { contract_version: "v1", error: { code: "approval_required", cause: "impact-confirmation-required", details: plan } };
test("isolated fixture acknowledges actual plan and separates data consent", () => {
 assert.deepEqual(fixtureConsent(failure), { plan_id: plan.plan_id, first: true, second: true, delete_data: false });
 assert.deepEqual(fixtureConsent({ ...failure, error: { ...failure.error, details: { scope: { ...plan, version: "baseharbor.provider-impact-scope/v1", destructive: true } } } }), { plan_id: plan.plan_id, first: true, second: true, delete_data: true });
 for (const changed of [{ ...plan, plan_id: "guessed" }, { ...plan, version: "v2" }, { ...plan, confirmations_required: 1 }, { ...plan, destructive: "yes" }]) assert.throws(() => fixtureConsent({ ...failure, error: { ...failure.error, details: changed } }));
 for (const cause of ["stale-impact-consent", "partial-cleanup", "provider_consumer_inventory_invalid"]) assert.throws(() => fixtureConsent({ ...failure, error: { ...failure.error, cause } }));
});
