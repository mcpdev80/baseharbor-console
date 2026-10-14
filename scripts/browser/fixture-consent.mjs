import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

// Test fixtures deliberately acknowledge Core's actual current refusal once.
// No credentials, persisted consent, guessed plan IDs or mutation retries.
export function fixtureConsent(value) {
  assert.equal(value.contract_version, "v1");
  assert.equal(value.error?.code, "approval_required");
  assert.equal(value.error?.cause, "impact-confirmation-required");
  const details = value.error.details;
  const plan = details?.scope ?? details;
  assert.ok(["baseharbor.provider-impact/v1", "baseharbor.provider-impact-scope/v1"].includes(plan?.version));
  assert.match(plan.plan_id, /^[0-9a-f]{64}$/);
  assert.ok([1, 2].includes(plan.confirmations_required));
  assert.equal(typeof plan.destructive, "boolean");
  assert.equal(typeof plan.complete, "boolean");
  if (!plan.complete || plan.destructive || plan.attention) assert.equal(plan.confirmations_required, 2);
  return { plan_id: plan.plan_id, first: true, second: plan.confirmations_required === 2, delete_data: plan.destructive };
}

// Failure diagnostics expose only fixed classifications and counts. Never copy
// native stderr, command arguments, owner paths or free-form detail strings.
export function fixtureFailureSummary(failure) {
  const raw = [failure.stdout, failure.stderr].map(value => value?.toString().slice(0, 1024 * 1024) ?? "");
  const parse = value => { try { return JSON.parse(value); } catch { return {}; } };
  const report = parse(raw[0]), envelope = parse(raw[1]);
  const codes = ["approval_required", "conflict", "internal_error", "ownership_ambiguous", "validation_failed", "provider_unavailable", "not_found", "unsupported"];
  const code = codes.includes(envelope.error?.code) ? envelope.error.code : "unknown";
  const markers = ["stale-impact-consent", "impact-confirmation-required", "provider_retirement_unverifiable", "provider_consumer_inventory_invalid", "runtime_mutation_owner_unverifiable", "in use", "ownership", "shared backend", "manifest does not match backup desired state"];
  const text = raw.join("\n").toLowerCase();
  const observed_markers = markers.filter(marker => text.includes(marker));
  const result_counts = {};
  for (const row of Array.isArray(report.results) ? report.results : []) {
    if (["FAILED", "SKIPPED", "REMOVED", "PRESERVED", "DEFERRED", "NOT FOUND"].includes(row?.status)) result_counts[row.status] = (result_counts[row.status] ?? 0) + 1;
  }
  return { code, observed_markers, result_counts };
}

export function runFixtureCLI(root, args, options = {}) {
  assert.equal(root, process.env.BASEHARBOR_BROWSER_FIXTURE);
  const actual = fs.realpathSync(root), cwd = fs.realpathSync(options.cwd ?? path.join(root, "work"));
  assert.ok(cwd === actual || cwd.startsWith(actual + path.sep));
  const env = { ...process.env, ...options.env };
  for (const key of ["XDG_DATA_HOME", "XDG_CONFIG_HOME"]) assert.ok(path.resolve(env[key]).startsWith(actual + path.sep));
  delete env.BASEHARBOR_PROVIDER_CHANGE_CONSENT;
  const lifecycle = args.some(arg => ["up", "down", "apply", "destroy"].includes(arg));
  const selected = args.includes("--json") || !lifecycle ? args : [...args, "--json"];
  const run = current => execFileSync(path.join(root, "baha"), selected, { encoding: "utf8", stdio: "pipe", timeout: 300000, ...options, cwd, env: current });
  if (!lifecycle) return run(env);
  try { return run(env); }
  catch (failure) {
    let value;
    try { value = JSON.parse(failure.stderr?.toString()); }
    catch {
      console.error(JSON.stringify({ fixture_cli_failure: fixtureFailureSummary(failure) }));
      throw new Error("Native fixture CLI failed without a structured current-plan refusal");
    }
    const consent = fixtureConsent(value);
    console.log("isolated-fixture-acknowledges-current-Core-plan-two-stages-and-separate-data-consent-where-required");
    try { return run({ ...env, BASEHARBOR_PROVIDER_CHANGE_CONSENT: JSON.stringify(consent) }); }
    catch (failure) {
      console.error(JSON.stringify({ fixture_cli_failure: fixtureFailureSummary(failure) }));
      throw new Error("Native fixture CLI failed after one explicit current-plan acknowledgement; mutation is not replayed");
    }
  }
}
