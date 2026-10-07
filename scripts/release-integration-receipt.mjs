import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = "mcpdev80/baseharbor-console";
const gate = "integration/static/live-console";
const requiredSteps = {
  "oidc-origin-role": ["real-keycloak-code-S256-login", "actual-Core-binds-browser-origin-to-one-installation", "actual-Core-viewer-read-allowed-mutation-and-destruction-denied", "real-token-expiry-ends-Console-session-and-Core-admission", "actual-Core-rejects-real-issuer-token-with-wrong-audience"],
  "plan-apply-result-events": ["actual-Core-POST-SSE-GET-and-empty-read-model", "actual-browser-first-apply-Core-required-explicit-bootstrap-SQL-Secrets-Identity-READY-and-same-application-continuation"],
  "logs-follow-cancel": ["actual-browser-Core-owned-container-logs-read-follow-new-output-cancel-without-replay"],
  "terminal-resize-close": ["actual-browser-Core-owned-container-PTY-input-output-resize-exit-and-foreign-actor-denial"],
  "core-setup": ["actual-browser-first-apply-Core-required-explicit-bootstrap-SQL-Secrets-Identity-READY-and-same-application-continuation"],
  "application-lifecycle": ["actual-browser-Core-application-plan-status-doctor-repair-explicit-destroy-and-foreign-issuer-preservation", "actual-browser-authoritative-status-ready-doctor-healthy-before-and-after-rotation"],
  "production-rotation": ["actual-browser-approved-production-credential-CA-rotation-changed-native-CA-and-post-rotation-application-status-doctor"],
};

// A source test or an older limited browser receipt cannot become complete
// release evidence. The trusted workflow still supplies authenticated origins;
// public Core independently verifies those origins, attempt and archive digest.
export function integrationReceipt(native, source, origin) {
  assert.equal(native.schema, "baseharbor.private-browser-receipt/v1");
  assert.equal(source.schema, "baseharbor.private-integration-source/v1");
  assert.equal(source.source_result, "success");
  assert.equal(native.repository, repository); assert.equal(source.repository, repository);
  for (const field of ["commit", "core_commit", "demo_commit"]) assert.match(source[field], /^[0-9a-f]{40}$/);
  assert.equal(native.commit, source.commit); assert.equal(native.core_commit, source.core_commit);
  assert.equal(native.demo_commit, source.demo_commit);
  assert.equal(native.result, "success"); assert.equal(native.cleanup, "success");
  for (const flag of ["core_bootstrap_evidence", "application_lifecycle_evidence", "terminal_runtime_evidence", "logs_runtime_evidence", "production_rotation_evidence"]) assert.equal(native[flag], true);
  assert.ok(Array.isArray(native.steps));
  const qualifications = {};
  for (const [name, steps] of Object.entries(requiredSteps)) {
    for (const step of steps) assert.ok(native.steps.includes(step), "Required native journey is missing");
    qualifications[name] = true;
  }
  qualifications["owned-cleanup"] = true;
  assert.match(origin.run_id, /^[1-9][0-9]*$/);
  assert.ok(Number.isSafeInteger(origin.attempt) && origin.attempt > 0);
  assert.ok(Number.isSafeInteger(origin.job_id) && origin.job_id > 0);
  assert.match(origin.build_sha256, /^[0-9a-f]{64}$/);
  assert.equal(String(native.run_id), origin.run_id);
  assert.equal(Number(native.run_attempt), origin.attempt);
  return { schema: "baseharbor.private-integration-evidence/v1", repository,
    consumer_commit: source.commit, core_commit: source.core_commit, demo_commit: source.demo_commit,
    role: "console", gate, workflow_run_id: origin.run_id, workflow_run_attempt: origin.attempt,
    job_id: origin.job_id, build_sha256: origin.build_sha256, result: "success", cleanup_result: "success",
    release_eligible: true, production_authority: true, qualifications };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const output = process.argv[5];
  assert.ok(output && path.isAbsolute(output), "Absolute owned evidence output is required");
  fs.rmSync(output, { force: true });
  try {
    const [native, source, origin] = process.argv.slice(2, 5).map(file => JSON.parse(fs.readFileSync(file, "utf8")));
    fs.writeFileSync(output, JSON.stringify(integrationReceipt(native, source, origin), null, 2) + "\n", { mode: 0o600 });
  } catch {
    console.error("Complete exact-source native Console qualification is required; no successful release receipt was written.");
    process.exitCode = 1;
  }
}
