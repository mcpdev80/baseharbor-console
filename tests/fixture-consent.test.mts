import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { fixtureConsent, runConsentedCLI, verifiedInstallationRemainder } from "../scripts/browser/fixture-consent.mjs";

const target = "browser-runtime";
const plan = { version: "baseharbor.provider-impact/v1", target, revision: "observed", plan_id: "a".repeat(64),
  complete: false, confirmations_required: 2, destructive: true, impacts: [] };
const refusal = (details: unknown = plan) => ({ code: "approval_required", cause: "impact-confirmation-required", details });
const failure = (error: unknown, stdout = "") => Object.assign(new Error("Core refused fixture command"), {
  stderr: JSON.stringify({ contract_version: "v1", error }), stdout,
});
const env = { XDG_CONFIG_HOME: "/isolated/config", XDG_DATA_HOME: "/isolated/data", BASEHARBOR_PROVIDER_CHANGE_CONSENT: "inherited-invalid" };

test("fixture acknowledges the actual selected plan and separately authorizes destructive data", () => {
  assert.deepEqual(fixtureConsent(refusal(), target), { plan_id: plan.plan_id, first: true, second: true, delete_data: true });
  const ordinary = { ...plan, confirmations_required: 1, destructive: false, complete: true };
  assert.deepEqual(fixtureConsent(refusal(ordinary), target), { plan_id: plan.plan_id, first: true, second: false, delete_data: false });
  for (const error of [refusal({ ...plan, target: "foreign" }), { ...refusal(), code: "conflict", cause: "stale-impact-consent" }, refusal({ ...plan, plan_id: "moving" })]) {
    assert.throws(() => fixtureConsent(error, target));
  }
});

test("CLI clears inherited consent and allows one exact-plan retry, never refreshing a stale plan", () => {
  const calls: Array<{ args: string[]; env: Record<string,string> }> = [];
  const run = (args: string[], options: { env: Record<string,string> }) => {
    calls.push({ args, env: options.env });
    if (calls.length === 1) throw failure(refusal());
    return "actual CLI success";
  };
  assert.equal(runConsentedCLI(run, ["up", "--yes"], target, { env }), "actual CLI success");
  assert.deepEqual(calls[0].args, ["up", "--yes", "--json"]);
  assert.equal(calls[0].env.BASEHARBOR_PROVIDER_CHANGE_CONSENT, undefined);
  assert.deepEqual(JSON.parse(calls[1].env.BASEHARBOR_PROVIDER_CHANGE_CONSENT), fixtureConsent(refusal(), target));
  let count = 0;
  assert.throws(() => runConsentedCLI(() => {
    count++;
    throw failure(count === 1 ? refusal() : { ...refusal(), code: "conflict", cause: "stale-impact-consent" });
  }, ["up"], target, { env }));
  assert.equal(count, 2);
});

const child = (subject: string) => ({ scope: { owner: { owner: "application-deployment", subject,
  reference: `/isolated/data/baseharbor/targets/browser-runtime/${subject}/deployment.json` } } });
const firstID = "11111111-1111-4111-8111-111111111111", secondID = "22222222-2222-4222-8222-222222222222";
const installation = { all: true, scope: { version: "baseharbor.provider-impact-scope/v1", plan_id: "b".repeat(64),
  owner: { owner: "installation.destroy", subject: "installation.destroy", reference: "/isolated/config/baseharbor/config.yaml", revision: "protected" },
  complete: false, confirmations_required: 2, destructive: true, targets: [] },
  resources: [{ target, project: "owned", kind: "container", name: "owned" }], discovery: [],
  local_state_selected_for_deletion: [], application_resets: [child(firstID),child(secondID)] };
const next = { ...installation, scope: { ...installation.scope, plan_id: "c".repeat(64) },
  application_resets: [child(secondID)], resources: [], continuation: { previous_plan_id: installation.scope.plan_id, completed_deployment_ids: [firstID] } };
const report = JSON.stringify({ all: true, preview: false, destroyed: false, results: [{ status: "REMOVED" }] });

test("installation remainder requires exact proven child progress and cannot expand ownership", () => {
  assert.deepEqual(verifiedInstallationRemainder(installation,refusal(next),report,env), next);
  for (const changed of [
    { ...next, continuation: { ...next.continuation, previous_plan_id: "unrelated" } },
    { ...next, application_resets: installation.application_resets },
    { ...next, resources: [{ target: "foreign", project: "owned", kind: "container", name: "foreign" }] },
    { ...next, scope: { ...next.scope, owner: { ...next.scope.owner, reference: "/foreign/config.yaml" } } },
  ]) assert.throws(() => verifiedInstallationRemainder(installation,refusal(changed),report,env));
  assert.throws(() => verifiedInstallationRemainder(installation,refusal(next),JSON.stringify({ all: true, preview: false, destroyed: false, results: [{ status: "REMOVED" },{ status: "FAILED" }] }),env));
});

test("emergency cleanup entry rejects arbitrary commands and non-isolated roots before execution", () => {
  const helper = fileURLToPath(new URL("../scripts/browser/fixture-consent.mjs", import.meta.url));
  for (const args of [["up"], ["--cleanup"]]) {
    assert.throws(() => execFileSync(process.execPath, [helper,...args], {
      env: { ...process.env, BASEHARBOR_BROWSER_FIXTURE: "relative-untrusted-root" }, stdio: "pipe", timeout: 10000,
    }));
  }
});
