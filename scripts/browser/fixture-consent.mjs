import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readProviderImpact, providerConsent } from "../../src/lib/baseharbor/provider-consent.ts";

// Isolated native fixtures acknowledge only an actual current Core refusal.
// A stale plan or any unrelated failure is fatal; there is no mutation loop.
export function refusedImpact(error, target) {
  assert.equal(error?.code, "approval_required");
  assert.ok(["impact-confirmation-required", "data-deletion-consent-required"].includes(error?.cause));
  const review = readProviderImpact(error.details, target);
  assert.ok(review, "Core did not return a typed impact plan for the selected target");
  assert.match(review.planId, /^[0-9a-f]{64}$/);
  return review;
}
export function fixtureConsent(error, target, fullReset = false) {
  const review = refusedImpact(error, target);
  if (fullReset) assert.equal(error.details?.scope?.version, "baseharbor.provider-impact-scope/v1", "Full reset requires the actual outer destruction scope");
  // These are explicit fixture acknowledgements for this displayed isolated
  // owner, not a product default or an implication of ordinary approval.
  return providerConsent(review, { first: true, second: review.confirmations === 2, deleteData: review.destructive });
}
export async function acknowledgeDisplayedImpact(page, error, target) {
  const review = refusedImpact(error, target);
  const display = page.getByRole("group", { name: "Provider consequences", exact: true });
  await display.waitFor();
  assert.ok((await display.locator("pre").textContent()).includes(review.planId));
  const operation = await page.getByLabel("Operation", { exact: true }).inputValue();
  const ordinary = page.getByRole("checkbox", { name: `I approve ${operation} for this exact application, environment and target.`, exact: true });
  if (await ordinary.count()) {
    assert.equal(await ordinary.isChecked(), false, "Failed request retained ordinary approval");
    await ordinary.check();
  }
  for (let index = 1; index <= review.confirmations; index++) {
    const checkbox = page.getByRole("checkbox", { name: `I acknowledge provider consequences (${index}/${review.confirmations}).`, exact: true });
    assert.equal(await checkbox.isChecked(), false, "New impact plan inherited an acknowledgement");
    await checkbox.check();
  }
  if (review.destructive) {
    const deletion = page.getByRole("checkbox", { name: "I separately authorize deletion of the displayed owned data.", exact: true });
    assert.equal(await deletion.isChecked(), false);
    await deletion.check();
  }
}
export function runConsentedCLI(run, args, target, options = {}) {
  const selected = args.includes("--json") ? args : [...args, "--json"];
  const env = { ...(options.env ?? process.env) };
  delete env.BASEHARBOR_PROVIDER_CHANGE_CONSENT;
  try { return run(selected, { ...options, env }); }
  catch (error) {
    const refusal = JSON.parse(error.stderr?.toString() ?? "");
    assert.equal(refusal.contract_version, "v1");
    const installation = selected.includes("--all") && selected[0] === "destroy";
    let consent = installation ? installationConsent(refusal.error, env) : fixtureConsent(refusal.error, target, selected.includes("--full-reset"));
    let previous = refusal.error.details;
    for (let remaining = 64; remaining > 0; remaining--) {
      try { return run(selected, { ...options, env: { ...env, BASEHARBOR_PROVIDER_CHANGE_CONSENT: JSON.stringify(consent) } }); }
      catch (failure) {
        if (!installation) throw failure;
        const current = JSON.parse(failure.stderr?.toString() ?? "");
        assert.equal(current.contract_version, "v1");
        previous = verifiedInstallationRemainder(previous, current.error, failure.stdout?.toString() ?? "", env);
        consent = installationConsent(current.error, env);
      }
    }
    throw new Error("Installation cleanup exceeded the bounded isolated deployment count");
  }
}

function installationConsent(error, env) {
  assert.equal(error?.code, "approval_required");
  assert.equal(error?.cause, "impact-confirmation-required");
  const details = error.details, scope = details?.scope;
  assert.equal(details?.all, true);
  assert.equal(scope?.version, "baseharbor.provider-impact-scope/v1");
  assert.equal(scope.owner?.owner, "installation.destroy");
  assert.equal(scope.owner?.subject, "installation.destroy");
  assert.equal(scope.owner?.reference, `${env.XDG_CONFIG_HOME}/baseharbor/config.yaml`);
  assert.equal(typeof scope.owner?.revision, "string");
  assert.match(scope.plan_id, /^[0-9a-f]{64}$/);
  assert.equal(scope.destructive, true);
  assert.equal(typeof scope.complete, "boolean");
  assert.equal(scope.confirmations_required, 2);
  assert.ok(Array.isArray(scope.targets) && scope.targets.length === 0);
  assert.ok(Array.isArray(details.resources));
  assert.ok(details.resources.every(row => ["browser-runtime", "browser-node"].includes(row.target)));
  assert.ok(Array.isArray(details.application_resets));
  assert.ok(details.application_resets.length <= 64);
  for (const child of details.application_resets) {
    assert.equal(child.scope?.owner?.owner, "application-deployment");
    assert.ok(child.scope.owner.reference.startsWith(`${env.XDG_DATA_HOME}/baseharbor/targets/`));
    assert.match(child.scope.owner.subject, /^[0-9a-f-]{36}$/);
  }
  return { plan_id: scope.plan_id, first: true, second: true, delete_data: true };
}

// Installation destruction may stop after one verified child to disclose the
// exact remaining scope. This is a new explicit acknowledgement only after
// authenticated progress; stale/conflicting plans and failed children stop.
export function verifiedInstallationRemainder(previous, error, stdout, env) {
  installationConsent(error, env);
  const next = error.details, report = JSON.parse(stdout);
  assert.equal(report.all, true); assert.equal(report.preview, false); assert.equal(report.destroyed, false);
  assert.ok(Array.isArray(report.results) && report.results.some(row => row.status === "REMOVED"));
  assert.deepEqual(next.discovery ?? [], previous.discovery ?? []);
  for (const row of report.results) {
    assert.ok(!["FAILED", "DEFERRED"].includes(row.status));
    if (row.status === "SKIPPED") {
      assert.ok(["unregistered-deployment-state", "unregistered-target-runtime"].includes(row.diagnostic));
      assert.ok((previous.discovery ?? []).some(value => JSON.stringify(value) === JSON.stringify(row)));
    }
  }
  assert.equal(next.continuation?.previous_plan_id, previous.scope.plan_id);
  assert.notEqual(next.scope.plan_id, previous.scope.plan_id);
  const completed = next.continuation.completed_deployment_ids;
  assert.ok(Array.isArray(completed) && completed.length === 1);
  const before = previous.application_resets.map(child => child.scope.owner.subject).sort();
  assert.ok(before.length > 1 && new Set(before).size === before.length && before.includes(completed[0]));
  assert.deepEqual(next.application_resets.map(child => child.scope.owner.subject).sort(), before.filter(id => id !== completed[0]));
  const resource = row => JSON.stringify([row.target,row.project,row.kind,row.name]);
  const resources = new Set(previous.resources.map(resource));
  assert.ok(next.resources.every(row => resources.has(resource(row))));
  assert.deepEqual(next.local_state_selected_for_deletion, previous.local_state_selected_for_deletion);
  return next;
}

// Fixed emergency-cleanup entry point; it cannot execute caller-selected
// commands, target a different installation, or report cleanup success itself.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.deepEqual(process.argv.slice(2), ["--cleanup"]);
  const root = process.env.BASEHARBOR_BROWSER_FIXTURE;
  assert.ok(root && path.isAbsolute(root) && fs.realpathSync(root) === root);
  assert.equal(process.env.XDG_DATA_HOME, path.join(root, "data"));
  assert.equal(process.env.XDG_CONFIG_HOME, path.join(root, "config"));
  const binary = path.join(root, "baha");
  assert.ok(fs.lstatSync(binary).isFile(), "Fixture Core binary must be a regular isolated file");
  const run = (args, options) => execFileSync(binary, args, {
    cwd: path.join(root, "work"), encoding: "utf8", stdio: "pipe", timeout: 180000, ...options,
  });
  process.stdout.write(runConsentedCLI(run, ["destroy", "--all", "--yes"], "browser-runtime", { env: process.env }));
}
