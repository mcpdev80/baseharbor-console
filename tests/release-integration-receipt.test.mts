import test from "node:test";
import assert from "node:assert/strict";
import { integrationReceipt } from "../scripts/release-integration-receipt.mjs";

const source = { schema: "baseharbor.private-integration-source/v1", source_result: "success", repository: "mcpdev80/baseharbor-console", commit: "1".repeat(40), core_commit: "2".repeat(40), demo_commit: "3".repeat(40) };
const origin = { run_id: "12345", attempt: 2, job_id: 56789, build_sha256: "4".repeat(64) };
// Contract fixture only; tests do not emit runtime evidence or upload artifacts.
const native = { schema: "baseharbor.private-browser-receipt/v1", repository: source.repository, commit: source.commit, core_commit: source.core_commit, demo_commit: source.demo_commit,
  run_id: origin.run_id, run_attempt: "2", result: "success", cleanup: "success",
  core_bootstrap_evidence: true, application_lifecycle_evidence: true, terminal_runtime_evidence: true, logs_runtime_evidence: true, production_rotation_evidence: true,
  steps: ["real-keycloak-code-S256-login", "actual-Core-binds-browser-origin-to-one-installation", "actual-Core-viewer-read-allowed-mutation-and-destruction-denied",
    "real-token-expiry-ends-Console-session-and-Core-admission", "actual-Core-rejects-real-issuer-token-with-wrong-audience", "actual-Core-POST-SSE-GET-and-empty-read-model",
    "actual-browser-first-apply-Core-required-explicit-bootstrap-SQL-Secrets-Identity-READY-and-same-application-continuation",
    "actual-browser-Core-owned-container-logs-read-follow-new-output-cancel-without-replay", "actual-browser-Core-owned-container-PTY-input-output-resize-exit-and-foreign-actor-denial",
    "actual-browser-Core-application-plan-status-doctor-repair-explicit-destroy-and-foreign-issuer-preservation",
    "actual-browser-approved-production-credential-CA-rotation-changed-native-CA-and-post-rotation-application-status-doctor", "actual-browser-authoritative-status-ready-doctor-healthy-before-and-after-rotation"] };

test("private Console evidence binds source, Core, demo, actual attempt, build and complete native scope", () => {
  const receipt = integrationReceipt(native, source, origin);
  assert.equal(receipt.consumer_commit, source.commit); assert.equal(receipt.core_commit, source.core_commit); assert.equal(receipt.demo_commit, source.demo_commit);
  assert.equal(receipt.workflow_run_attempt, 2); assert.equal(receipt.job_id, origin.job_id);
  assert.deepEqual(Object.keys(receipt.qualifications).sort(), ["application-lifecycle", "core-setup", "logs-follow-cancel", "oidc-origin-role", "owned-cleanup", "plan-apply-result-events", "production-rotation", "terminal-resize-close"]);
  assert.ok(!JSON.stringify(receipt).includes("steps"));
});

test("old partial, failed, foreign and missing-journey native receipts cannot become release success", () => {
  for (const change of [{ result: "failure" }, { cleanup: "failure" }, { cleanup: "pending" }, { production_rotation_evidence: false },
    { core_bootstrap_evidence: false }, { application_lifecycle_evidence: false }, { terminal_runtime_evidence: false }, { logs_runtime_evidence: false },
    { commit: "5".repeat(40) }, { core_commit: "6".repeat(40) }, { demo_commit: undefined }, { demo_commit: "7".repeat(40) }, { repository: "foreign/console" }, { run_attempt: "1" }, { run_id: "999" },
    { steps: native.steps.slice(0, -1) }, { steps: [] }]) assert.throws(() => integrationReceipt({ ...native, ...change }, source, origin));
  for (const change of [{ schema: "source-only" }, { source_result: "failure" }, { repository: "foreign/console" }, { demo_commit: "moving-branch" }, { commit: "moving-branch" }]) assert.throws(() => integrationReceipt(native, { ...source, ...change }, origin));
  for (const change of [{ attempt: 0 }, { attempt: 1 }, { job_id: 0 }, { build_sha256: "source-only" }]) assert.throws(() => integrationReceipt(native, source, { ...origin, ...change }));
});
