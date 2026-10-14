import assert from "node:assert/strict";
import test from "node:test";
import { fixtureConsent, fixtureFailureSummary, fixtureInstallationRemainder } from "../scripts/browser/fixture-consent.mjs";

const plan = { version: "baseharbor.provider-impact/v1", plan_id: "a".repeat(64), complete: false, destructive: false, confirmations_required: 2, attention: "Achtung" };
const failure = { contract_version: "v1", error: { code: "approval_required", cause: "impact-confirmation-required", details: plan } };
test("isolated fixture acknowledges actual plan and separates data consent", () => {
 assert.deepEqual(fixtureConsent(failure), { plan_id: plan.plan_id, first: true, second: true, delete_data: false });
 assert.deepEqual(fixtureConsent({ ...failure, error: { ...failure.error, details: { scope: { ...plan, version: "baseharbor.provider-impact-scope/v1", destructive: true } } } }), { plan_id: plan.plan_id, first: true, second: true, delete_data: true });
 for (const changed of [{ ...plan, plan_id: "guessed" }, { ...plan, version: "v2" }, { ...plan, confirmations_required: 1 }, { ...plan, destructive: "yes" }]) assert.throws(() => fixtureConsent({ ...failure, error: { ...failure.error, details: changed } }));
 for (const cause of ["stale-impact-consent", "partial-cleanup", "provider_consumer_inventory_invalid"]) assert.throws(() => fixtureConsent({ ...failure, error: { ...failure.error, cause } }));
});

test("installation remainder requires typed successful progress and cannot expand selected owners or resources", () => {
 const first = "11111111-1111-4111-8111-111111111111", second = "22222222-2222-4222-8222-222222222222";
 const child = (id: string) => ({ scope: { owner: { subject: id } } });
 const scope = (id: string) => ({ ...plan, version: "baseharbor.provider-impact-scope/v1", plan_id: id.repeat(64), destructive: true, owner: { owner: "installation.destroy" } });
 const resource = { target: "isolated", project: "owned", kind: "volume", name: "owned-data" };
 const previous = { all: true, scope: scope("a"), application_resets: [child(first), child(second)], resources: [resource], local_state_selected_for_deletion: [{ reference: "/isolated/state" }] };
 const next = { ...previous, scope: scope("b"), application_resets: [child(second)], continuation: { previous_plan_id: previous.scope.plan_id, completed_deployment_ids: [first] } };
 const report = { all: true, preview: false, destroyed: false, results: [{ status: "REMOVED" }] };
 const failed = (current = next, progress = report) => ({ stderr: JSON.stringify({ ...failure, error: { ...failure.error, details: current } }), stdout: JSON.stringify(progress) });
 assert.deepEqual(fixtureInstallationRemainder(previous, failed()), next);
 const diagnostic = { status: "SKIPPED", diagnostic: "unregistered-deployment-state", target: "isolated", resource: "deployment orphan", detail: "No runtime owner inferred; selected local state remains explicitly disclosed" };
 const disclosedPrevious = { ...previous, discovery: [diagnostic] };
 const disclosedNext = { ...next, discovery: [diagnostic] };
 const diagnosticFailure = failed(disclosedNext, { ...report, results: [...report.results, diagnostic] });
 assert.deepEqual(fixtureInstallationRemainder(disclosedPrevious, diagnosticFailure), disclosedNext);
 const runtimeDiagnostic = { ...diagnostic, diagnostic: "unregistered-target-runtime", resource: "runtime-provider" };
 const runtimePrevious = { ...previous, discovery: [runtimeDiagnostic] }, runtimeNext = { ...next, discovery: [runtimeDiagnostic] };
 assert.deepEqual(fixtureInstallationRemainder(runtimePrevious, failed(runtimeNext, { ...report, results: [...report.results, runtimeDiagnostic] })), runtimeNext);
 for (const changed of [{ ...runtimeDiagnostic, diagnostic: "unknown" }, { ...runtimeDiagnostic, status: "FAILED" }, { ...runtimeDiagnostic, status: "DEFERRED" }]) assert.throws(() => fixtureInstallationRemainder(runtimePrevious, failed(runtimeNext, { ...report, results: [...report.results, changed] })));
 assert.throws(() => fixtureInstallationRemainder(previous, failed(runtimeNext, { ...report, results: [...report.results, runtimeDiagnostic] })));
 assert.throws(() => fixtureInstallationRemainder(previous, diagnosticFailure));
 assert.throws(() => fixtureInstallationRemainder(disclosedPrevious, failed(next, { ...report, results: [...report.results, diagnostic] })));
 assert.throws(() => fixtureInstallationRemainder(disclosedPrevious, failed(disclosedNext, { ...report, results: [...report.results, { ...diagnostic, detail: "changed unknown state" }] })));
 for (const changed of [
  { ...next, continuation: undefined },
  { ...next, continuation: { ...next.continuation, previous_plan_id: "c".repeat(64) } },
  { ...next, continuation: { ...next.continuation, completed_deployment_ids: [second] } },
  { ...next, application_resets: [] },
  { ...next, resources: [{ ...resource, name: "foreign-data" }] },
  { ...next, local_state_selected_for_deletion: [{ reference: "/foreign/state" }] },
  { ...next, scope: previous.scope },
 ]) assert.throws(() => fixtureInstallationRemainder(previous, failed(changed as typeof next)));
 for (const status of ["FAILED", "SKIPPED", "DEFERRED"]) assert.throws(() => fixtureInstallationRemainder(previous, failed(next, { ...report, results: [{ status: "REMOVED" }, { status }] })));
 assert.throws(() => fixtureInstallationRemainder(previous, { ...failed(), stderr: "unstructured failure with private material" }));
 const denied = JSON.parse(failed().stderr); denied.error.cause = "stale-impact-consent";
 assert.throws(() => fixtureInstallationRemainder(previous, { ...failed(), stderr: JSON.stringify(denied) }));
});

test("fixture failure diagnostics retain actual classifications without copying secret-bearing output", () => {
 const summary = fixtureFailureSummary({ stdout: JSON.stringify({ results: [{ status: "FAILED", detail: "provider change: stale-impact-consent password=never-copy-this", resource: "/private/owner" }, { status: "SKIPPED" }] }), stderr: JSON.stringify({ error: { code: "internal_error", message: "postgres://user:never-copy-this@private/owner" } }) });
 assert.deepEqual(summary, { code: "internal_error", observed_markers: ["stale-impact-consent"], result_counts: { FAILED: 1, SKIPPED: 1 }, skipped_categories: { other: 1 } });
 for (const value of ["never-copy-this", "private", "password", "postgres"]) assert.ok(!JSON.stringify(summary).includes(value));
 assert.deepEqual(fixtureFailureSummary({ stdout: "arbitrary secret", stderr: "malformed secret" }), { code: "unknown", observed_markers: [], result_counts: {}, skipped_categories: {} });
 assert.equal(fixtureFailureSummary({ stderr: JSON.stringify({ error: { code: "secret-code" } }) }).code, "unknown");
});
