import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";

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
  const skipped_categories = {};
  for (const row of Array.isArray(report.results) ? report.results : []) {
    if (["FAILED", "SKIPPED", "REMOVED", "PRESERVED", "DEFERRED", "NOT FOUND"].includes(row?.status)) result_counts[row.status] = (result_counts[row.status] ?? 0) + 1;
    if (row?.status === "SKIPPED") {
      const known = ["target-state", "target-runtime", "runtime-provider", "connectivity-runtime", "xdg-data", "xdg-config"];
      const category = typeof row.resource === "string" && row.resource.startsWith("deployment ") ? "deployment-state" : known.includes(row.resource) ? row.resource : "other";
      skipped_categories[category] = (skipped_categories[category] ?? 0) + 1;
    }
  }
  return { code, observed_markers, result_counts, skipped_categories };
}

// Only a typed, source-owned installation remainder can start another
// acknowledgement stage. Failed mutations and arbitrary CLI errors never retry.
export function fixtureInstallationRemainder(previous, failure) {
  const value = JSON.parse(failure.stderr?.toString());
  fixtureConsent(value);
  const next = value.error.details;
  const report = JSON.parse(failure.stdout?.toString());
  assert.equal(previous?.scope?.owner?.owner, "installation.destroy");
  assert.equal(next?.scope?.owner?.owner, "installation.destroy");
  assert.equal(previous.all, true);
  assert.equal(next.all, true);
  assert.equal(report.all, true);
  assert.equal(report.preview, false);
  assert.equal(report.destroyed, false);
  assert.ok(Array.isArray(report.results) && report.results.some(row => row.status === "REMOVED"));
  const disclosedDiscovery = previous.discovery ?? [];
  assert.deepEqual(next.discovery ?? [], disclosedDiscovery);
  const unchangedLocalDiscovery = row => row.status === "SKIPPED" && row.diagnostic === "unregistered-deployment-state"
    && disclosedDiscovery.some(item => isDeepStrictEqual(item, row));
  assert.ok(report.results.every(row => !["FAILED", "DEFERRED"].includes(row.status) && (row.status !== "SKIPPED" || unchangedLocalDiscovery(row))));
  assert.equal(next.continuation?.previous_plan_id, previous.scope.plan_id);
  assert.notEqual(next.scope.plan_id, previous.scope.plan_id);
  const completed = next.continuation?.completed_deployment_ids;
  assert.ok(Array.isArray(completed) && completed.length === 1);
  assert.match(completed[0], /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  const ids = plan => plan.application_resets.map(child => child.scope.owner.subject).sort();
  const before = ids(previous), after = ids(next);
  assert.ok(before.length > 1 && before.length <= 64 && new Set(before).size === before.length && before.includes(completed[0]));
  assert.deepEqual(after, before.filter(id => id !== completed[0]));
  const resource = row => JSON.stringify([row.target, row.project, row.kind, row.name]);
  const allowed = new Set(previous.resources.map(resource));
  assert.ok(next.resources.every(row => allowed.has(resource(row))));
  assert.deepEqual(next.local_state_selected_for_deletion, previous.local_state_selected_for_deletion);
  return next;
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
    let plan = value.error.details;
    let consent = fixtureConsent(value);
    for (let stage = 0; stage < 64; stage++) {
      console.log("isolated-fixture-acknowledges-current-Core-plan-two-stages-and-separate-data-consent-where-required");
      try { return run({ ...env, BASEHARBOR_PROVIDER_CHANGE_CONSENT: JSON.stringify(consent) }); }
      catch (failure) {
        try {
          plan = fixtureInstallationRemainder(plan, failure);
          consent = fixtureConsent(JSON.parse(failure.stderr.toString()));
          console.log("isolated-fixture-confirms-explicit-current-installation-remainder-after-verified-child-progress");
        } catch {
          console.error(JSON.stringify({ fixture_cli_failure: fixtureFailureSummary(failure) }));
          throw new Error("Native fixture CLI failed after explicit current-plan acknowledgement; no verified installation remainder, mutation is not replayed");
        }
      }
    }
    throw new Error("Native fixture installation continuation exceeded bounded child count");
  }
}
