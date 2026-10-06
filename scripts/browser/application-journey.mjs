import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

// Change only this isolated issuer's browser client after the real 60-second
// expiry test. The longer editor session is still a genuinely signed JWT.
export function extendEditorSession(root) {
  const container = fs.readFileSync(path.join(root, "keycloak.container"), "utf8").trim();
  const config = "/tmp/browser-qualification-kcadm.config";
  const run = args => execFileSync("docker", ["exec", container, "/opt/keycloak/bin/kcadm.sh", ...args], { encoding: "utf8", timeout: 30000, stdio: ["ignore", "pipe", "pipe"] });
  try {
    run(["config", "credentials", "--config", config, "--server", "http://localhost:8080", "--realm", "master", "--user", "fixture-admin", "--password", "isolated-browser-admin-only"]);
    const clients = JSON.parse(run(["get", "clients", "-r", "baseharbor-browser", "-q", "clientId=baseharbor-console-browser", "--config", config]));
    assert.equal(clients.length, 1);
    run(["update", "clients/" + clients[0].id, "-r", "baseharbor-browser", "--config", config, "-s", 'attributes={"pkce.code.challenge.method":"S256","access.token.lifespan":"1800"}']);
  } finally {
    execFileSync("docker", ["exec", container, "rm", "-f", config], { stdio: "pipe", timeout: 10000 });
  }
}

export async function qualifyApplicationJourney(page, root, origin) {
  // Production CLI authoring registers a source and deployment; it does not
  // provision Core or fabricate an applied runtime result.
  execFileSync(path.join(root, "baha"), ["app", "create", "browser-managed", "--sql", "--environment", "dev"], {
    cwd: path.join(root, "work"), env: { ...process.env, XDG_DATA_HOME: path.join(root, "data"), XDG_CONFIG_HOME: path.join(root, "config") },
    stdio: "pipe", timeout: 30000,
  });
  const records = [], requests = [], waiters = [];
  const destination = /^https:\/\/localhost:8443\/api\/v1\/machine\/executions\/[^/?]+$/;
  const requestListener = request => {
    if (request.url() === origin + "/api/v1/machine/executions" && request.method() === "POST") {
      const value = request.postDataJSON();
      requests.push({ operation_id: value.operation_id, context: value.context });
    }
  };
  page.on("request", requestListener);
  const observe = async route => {
    const response = await route.fetch({ maxRedirects: 0 });
    assert.equal(response.status(), 200);
    const value = await response.json();
    await route.fulfill({ response });
    records.push(value);
    for (const waiter of [...waiters]) if (waiter.matches(value)) { clearTimeout(waiter.timer); waiters.splice(waiters.indexOf(waiter), 1); waiter.resolve(value); }
  };
  await page.route(destination, observe);
  const terminal = (operation, state) => new Promise((resolve, reject) => {
    const matches = value => value.operation_id === operation && ["succeeded", "failed", "cancelled"].includes(value.state);
    const accept = value => { assert.equal(value.state, state, `Native ${operation}: ${value.error?.code}/${value.error?.cause}`); return value; };
    const waiter = { matches, resolve: value => { try { resolve(accept(value)); } catch (error) { reject(error); } },
      timer: setTimeout(() => { waiters.splice(waiters.indexOf(waiter), 1); reject(new Error(`Native ${operation} did not finish`)); }, 340000) };
    waiters.push(waiter);
  });
  const exactContext = { application: "browser-managed", environment: "dev", target: "browser-runtime" };
  const check = value => {
    assert.equal(value.actor.subject, "55555555-5555-4555-8555-555555555555");
    assert.deepEqual(value.context, exactContext);
  };
  try {
    await page.locator('nav[aria-label="Primary"] a[href="/applications"]').click();
    await page.getByLabel("Environment", { exact: true }).selectOption("dev");
    await page.getByRole("button", { name: "Read Core", exact: true }).click();
    await page.getByLabel("Deployment", { exact: true }).selectOption({ label: "browser-managed / dev / browser-runtime" });
    await page.getByLabel("Operation", { exact: true }).selectOption("apply");
    const approve = page.getByRole("checkbox", { name: "I approve apply for this exact application, environment and target.", exact: true });
    if (await approve.count()) await approve.check();
    const failedReply = terminal("apply", "failed");
    await page.getByRole("button", { name: "Submit to Core", exact: true }).click();
    const failed = await failedReply; check(failed);
    assert.equal(failed.error.code, "capability_missing"); assert.equal(failed.error.cause, "core_required"); assert.equal(failed.error.retryable, true);
    await page.getByLabel("Machine role", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("Setup environment", { exact: true }).inputValue(), "dev");
    assert.equal(await page.getByLabel("Installation target", { exact: true }).inputValue(), "browser-runtime");
    assert.equal(await page.getByLabel("Installation target", { exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "Set up Core", exact: true }).isDisabled(), true);
    await page.getByRole("checkbox", { name: "Set up the secure Core for this installation target.", exact: true }).check();
    const setupReply = terminal("control-plane.up", "succeeded"), resumedReply = terminal("apply", "succeeded");
    // Both observers are attached before submission; no mutation is replayed.
    const completed = Promise.all([setupReply, resumedReply]);
    await page.getByRole("button", { name: "Set up Core", exact: true }).click();
    const [setup, resumed] = await completed;
    assert.deepEqual(setup.context, { environment: "dev", target: "browser-runtime" });
    assert.equal(setup.actor.subject, failed.actor.subject);
    assert.equal(setup.result.ready, true); assert.equal(setup.result.phase, "ready");
    assert.deepEqual(setup.result.capabilities, { sql: true, secrets: true, identity: true });
    assert.equal(setup.result.spec.machine_role, "development");
    assert.match(setup.result.installation_id, /^[0-9a-f-]{36}$/);
    check(resumed); assert.notEqual(resumed.execution_id, failed.execution_id);
    assert.deepEqual(requests.filter(value => ["apply", "control-plane.up"].includes(value.operation_id)), [
      { operation_id: "apply", context: exactContext },
      { operation_id: "control-plane.up", context: { environment: "dev", target: "browser-runtime" } },
      { operation_id: "apply", context: exactContext },
    ]);
    for (const operation of ["plan", "status", "doctor", "repair", "destroy"]) {
      await page.getByRole("button", { name: "Submit to Core", exact: true }).waitFor();
      await page.getByLabel("Operation", { exact: true }).selectOption(operation);
      const approval = page.getByRole("checkbox", { name: `I approve ${operation} for this exact application, environment and target.`, exact: true });
      if (await approval.count()) {
        assert.equal(await page.getByRole("button", { name: "Submit to Core", exact: true }).isDisabled(), true);
        await approval.check();
      }
      const reply = terminal(operation, "succeeded");
      await page.getByRole("button", { name: "Submit to Core", exact: true }).click();
      check(await reply);
    }
    assert.equal(execFileSync("docker", ["inspect", "--format", "{{.State.Running}}", fs.readFileSync(path.join(root, "keycloak.container"), "utf8").trim()], { encoding: "utf8" }).trim(), "true");
    execFileSync(path.join(root, "baha"), ["destroy", "--all", "--yes"], {
      cwd: path.join(root, "work"), env: { ...process.env, XDG_DATA_HOME: path.join(root, "data"), XDG_CONFIG_HOME: path.join(root, "config") }, stdio: "pipe", timeout: 180000,
    });
    fs.writeFileSync(path.join(root, "core-cleanup.complete"), "owned-Core-removed\n", { mode: 0o600 });
    // Restore only the explicit local target for the subsequent independent
    // terminal test. No installation state or runtime result is recreated.
    fs.mkdirSync(path.join(root, "config", "baseharbor"), { recursive: true, mode: 0o700 });
    fs.copyFileSync(path.join(root, "target-config.yaml"), path.join(root, "config", "baseharbor", "config.yaml"));
    assert.equal(execFileSync("docker", ["inspect", "--format", "{{.State.Running}}", fs.readFileSync(path.join(root, "keycloak.container"), "utf8").trim()], { encoding: "utf8" }).trim(), "true");
    return ["actual-browser-first-apply-Core-required-explicit-bootstrap-SQL-Secrets-Identity-READY-and-same-application-continuation", "actual-browser-Core-application-plan-status-doctor-repair-explicit-destroy-and-foreign-issuer-preservation"];
  } finally {
    page.off("request", requestListener);
    await page.unroute(destination, observe);
    for (const waiter of waiters) clearTimeout(waiter.timer);
    console.log(JSON.stringify({ application_journey: records.map(value => ({ operation: value.operation_id, state: value.state, code: value.error?.code, cause: value.error?.cause })) }));
  }
}
