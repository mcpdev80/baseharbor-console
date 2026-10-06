import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomBytes, createHash } from "node:crypto";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
assert.equal(require("playwright/package.json").version, "1.62.1");
const origin = "https://localhost:8443";
const root = process.env.BASEHARBOR_BROWSER_FIXTURE;
assert.ok(root && path.isAbsolute(root));
const steps = [];
const browser = await chromium.launch({ headless: true });
// Read actual upstream JSON before Chromium can invalidate its body handle.
// route.fetch sends the original request to the native service; fulfill forwards
// that exact response unchanged. Neither token nor execution is fabricated.
async function captureNativeJson(page, destination, status = 200) {
  let resolve, reject;
  const reply = new Promise((accept, fail) => { resolve = accept; reject = fail; });
  await page.route(destination, async route => {
    try {
      const response = await route.fetch({ maxRedirects: 0 });
      assert.equal(response.status(), status);
      const value = await response.json();
      await route.fulfill({ response });
      resolve(value);
    } catch (error) {
      reject(error);
      await route.abort();
    }
  }, { times: 1 });
  return { reply };
}
function captureTokenResponse(page) {
  return captureNativeJson(page, origin + "/realms/baseharbor-browser/protocol/openid-connect/token");
}
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();
page.setDefaultTimeout(20000);
const network = [];
let tokenBoundary;
page.on("response", async response => {
  const url = new URL(response.url());
  if (url.origin === origin && (url.pathname.startsWith("/api/") || url.pathname.endsWith("/token"))) network.push({ path: url.pathname, method: response.request().method(), status: response.status() });

});
try {
  await page.goto(origin + "/applications");
  await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();
  const tokenResponse = await captureTokenResponse(page);
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const popup = await popupPromise;
  await popup.locator("#username").fill("browser-owner");
  await popup.locator("#password").fill("isolated-browser-test-password");
  await popup.locator("#kc-login").click();
  await page.getByRole("button", { name: "Sign out", exact: true }).waitFor();
  assert.ok(popup.isClosed(), "Authorization callback did not close the sign-in window");
  steps.push("real-keycloak-code-S256-login");
  await page.getByLabel("Environment", { exact: true }).selectOption("dev");
  const executionResponse = await captureNativeJson(page, /^https:\/\/localhost:8443\/api\/v1\/machine\/executions\/[^/?]+$/);
  await page.getByRole("button", { name: "Read Core", exact: true }).click();
  await page.getByText("Core returned no records.", { exact: true }).waitFor();
  const execution = await executionResponse.reply;
  assert.equal(execution.state, "succeeded");
  assert.equal(execution.operation_id, "app.list");
  assert.equal(execution.actor?.subject, "22222222-2222-4222-8222-222222222222");
  assert.equal(execution.context?.environment, "dev");
  assert.deepEqual(execution.result?.deployments, []);
  steps.push("actual-Core-POST-SSE-GET-and-empty-read-model");
  const actualToken = await tokenResponse.reply;
  const parts = actualToken.access_token.split(".");
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString()), claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  tokenBoundary = { issuer_matches: claims.iss === origin + "/realms/baseharbor-browser", audience_matches: (Array.isArray(claims.aud) ? claims.aud : [claims.aud]).includes("baseharbor-api"), subject_matches: claims.sub === "22222222-2222-4222-8222-222222222222", not_expired: claims.exp > Date.now() / 1000, algorithm: header.alg };
  assert.equal((await context.request.get(origin + "/api/v1/machine/discovery")).status(), 401);
  assert.equal((await context.request.get(origin + "/api/v1/machine/discovery", { headers: { Authorization: "Bearer " + actualToken.access_token } })).status(), 200);
  steps.push("actual-Core-rejects-issuer-cookies-without-bearer");
  for (const browserOrigin of ["https://other-installation.example", "https://localhost:9443"]) {
    const denied = await context.request.get(origin + "/api/v1/machine/discovery", {
      headers: { Authorization: "Bearer " + actualToken.access_token, Origin: browserOrigin, "X-Forwarded-Host": "other-installation.example" },
    });
    assert.equal(denied.status(), 403);
  }
  assert.equal((await context.request.get(origin + "/api/v1/machine/discovery", {
    headers: { Authorization: "Bearer " + actualToken.access_token, Origin: origin },
  })).status(), 200);
  steps.push("actual-Core-binds-browser-origin-to-one-installation");
  for (const operation_id of ["apply", "destroy"]) {
    const denied = await context.request.post(origin + "/api/v1/machine/executions", {
      headers: { Authorization: "Bearer " + actualToken.access_token },
      data: { operation_id, context: { environment: "dev" }, input: {} },
    });
    assert.equal(denied.status(), 403);
    const result = await denied.json();
    assert.equal(result.error.code, "policy_denied");
    assert.equal(result.error.cause, "tenant_permission_denied");
  }
  steps.push("actual-Core-viewer-read-allowed-mutation-and-destruction-denied");

  // Read the real issuer container through Core's native Docker adapter. The
  // UI uses the exact identity returned by Core, not a browser test fixture.
  await page.locator('nav[aria-label="Primary"] a[href="/runtime"]').click();
  await page.getByRole("heading", { name: "Runtime Explorer", exact: true }).waitFor();
  await page.getByLabel("Environment", { exact: true }).selectOption("dev");
  await page.getByLabel("Core target (required)", { exact: true }).fill("browser-runtime");
  const runtimeResponse = await captureNativeJson(page, /^https:\/\/localhost:8443\/api\/v1\/machine\/executions\/[^/?]+$/);
  await page.getByRole("button", { name: "Read Core", exact: true }).click();
  await page.getByLabel("Details resource", { exact: true }).waitFor();
  const runtime = await runtimeResponse.reply;
  assert.equal(runtime.operation_id, "runtime.list"); assert.equal(runtime.state, "succeeded");
  const container = fs.readFileSync(path.join(root, "keycloak.container"), "utf8").trim();
  const index = runtime.result.findIndex(row => row.runtime_name === container || row.runtime_name === "/" + container);
  assert.ok(index >= 0, "Actual issuer container was not returned by Core");
  const ref = runtime.result[index].ref;
  assert.equal(ref.target, "browser-runtime"); assert.equal(ref.provider, "docker"); assert.equal(ref.kind, "container");
  await page.getByLabel("Details resource", { exact: true }).selectOption(String(index));
  const detailResponse = await captureNativeJson(page, /^https:\/\/localhost:8443\/api\/v1\/machine\/executions\/[^/?]+$/);
  await page.getByRole("button", { name: "Inspect resource", exact: true }).click();
  const detail = await detailResponse.reply;
  assert.equal(detail.operation_id, "runtime.inspect"); assert.equal(detail.state, "succeeded"); assert.deepEqual(detail.result.ref, ref);
  await page.locator("dd").getByText(ref.resource_id, { exact: true }).waitFor();
  const metricsResponse = await captureNativeJson(page, /^https:\/\/localhost:8443\/api\/v1\/machine\/executions\/[^/?]+$/);
  await page.getByRole("button", { name: "Read metrics", exact: true }).click();
  const metrics = await metricsResponse.reply;
  assert.equal(metrics.operation_id, "runtime.metrics"); assert.equal(metrics.state, "succeeded");
  if (metrics.result.sample) { assert.equal(metrics.result.sample.resource_id, ref.resource_id); await page.getByText("Observed at " + metrics.result.sample.observed_at, { exact: true }).waitFor(); }
  else await page.getByText(metrics.result.available ? "Core has metrics available but returned no native sample." : "Core reports metrics unavailable for this resource.", { exact: true }).waitFor();
  await page.getByLabel("Details resource", { exact: true }).selectOption("");
  assert.equal(await page.locator("dd").count(), 0);
  steps.push("actual-Core-native-runtime-list-inspect-metrics-and-selection-reset");

  await page.locator('nav[aria-label="Primary"] a[href="/settings"]').click();
  await page.getByRole("heading", { name: "Settings", exact: true }).waitFor();
  await page.getByLabel("Setup environment", { exact: true }).selectOption("dev");
  await page.getByLabel("Installation target", { exact: true }).fill("browser-runtime");
  await page.getByLabel("Machine role", { exact: true }).selectOption("deployment");
  const setup = page.getByRole("button", { name: "Set up Core", exact: true });
  assert.equal(await setup.isDisabled(), true);
  await page.getByRole("checkbox", { name: "Set up the secure Core for this installation target.", exact: true }).check();
  const setupAdmission = page.waitForResponse(response => response.url() === origin + "/api/v1/machine/executions" && response.request().method() === "POST");
  await setup.click();
  const deniedSetup = await setupAdmission;
  assert.equal(deniedSetup.status(), 403);
  const setupRequest = deniedSetup.request().postDataJSON();
  assert.equal(setupRequest.operation_id, "control-plane.up"); assert.deepEqual(setupRequest.context, { environment: "dev", target: "browser-runtime" }); assert.deepEqual(setupRequest.input, { machine_role: "deployment" });
  await page.getByRole("alert").getByText("Core denied this setup request. Obtain the required installation permission before retrying.", { exact: true }).waitFor();
  steps.push("actual-Core-setup-wizard-role-selection-explicit-submission-and-viewer-denial");

  const persisted = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookies: document.cookie }));
  assert.ok(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./.test(JSON.stringify(persisted)), "Bearer material persisted in browser storage");
  steps.push("no-bearer-in-browser-storage");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByLabel("Setup environment", { exact: true }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();
  await page.locator('nav[aria-label="Primary"] a[href="/runtime"]').click();
  await page.getByRole("heading", { name: "Core session ended", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Read Core", exact: true }).count(), 0);
  await page.getByRole("button", { name: "View fixture preview", exact: true }).click();
  await page.getByRole("heading", { name: "Core session ended", exact: true }).waitFor({ state: "hidden" });
  steps.push("logout-with-explicit-preview-choice");
  // A fresh browser context cannot recover the in-memory Core session.
  const fresh = await browser.newContext({ ignoreHTTPSErrors: true });
  const freshPage = await fresh.newPage();
  await freshPage.goto(origin + "/applications");
  await freshPage.getByRole("button", { name: "Sign in", exact: true }).waitFor();
  assert.equal(await freshPage.getByRole("button", { name: "Sign out", exact: true }).count(), 0);
  steps.push("fresh-context-has-no-Core-session");
  const expiryTokenResponse = await captureTokenResponse(freshPage);
  const expiryPopupPromise = freshPage.waitForEvent("popup");
  await freshPage.getByRole("button", { name: "Sign in", exact: true }).click();
  const expiryPopup = await expiryPopupPromise;
  await expiryPopup.locator("#username").fill("browser-owner");
  await expiryPopup.locator("#password").fill("isolated-browser-test-password");
  await expiryPopup.locator("#kc-login").click();
  await freshPage.getByRole("button", { name: "Sign out", exact: true }).waitFor();
  const expiryToken = await expiryTokenResponse.reply;
  assert.equal(expiryToken.expires_in, 60);
  await freshPage.getByRole("heading", { name: "Core session ended", exact: true }).waitFor({ timeout: 75000 });
  assert.equal(await freshPage.getByRole("button", { name: "Read Core", exact: true }).count(), 0);
  assert.equal((await fresh.request.get(origin + "/api/v1/machine/discovery", { headers: { Authorization: "Bearer " + expiryToken.access_token } })).status(), 401);
  steps.push("real-token-expiry-ends-Console-session-and-Core-admission");
  await fresh.close();
  // Obtain a genuinely signed token from a different public browser client.
  // No HTTP response, identity principal or Core execution is mocked here.
  const deniedContext = await browser.newContext({ ignoreHTTPSErrors: true });
  const deniedPage = await deniedContext.newPage();
  const verifier = randomBytes(32).toString("base64url"), state = randomBytes(24).toString("base64url");
  const authorization = new URL(origin + "/realms/baseharbor-browser/protocol/openid-connect/auth");
  for (const [key, value] of Object.entries({ client_id: "baseharbor-console-wrong-audience", response_type: "code", scope: "openid", redirect_uri: origin + "/auth/callback", state, code_challenge_method: "S256", code_challenge: createHash("sha256").update(verifier).digest("base64url") })) authorization.searchParams.set(key, value);
  await deniedPage.goto(authorization.href);
  await deniedPage.locator("#username").fill("browser-owner");
  await deniedPage.locator("#password").fill("isolated-browser-test-password");
  const callbackRequest = deniedPage.waitForRequest(request => new URL(request.url()).pathname === "/auth/callback");
  await deniedPage.locator("#kc-login").click();
  const callback = new URL((await callbackRequest).url());
  assert.equal(callback.searchParams.get("state"), state);
  assert.ok(callback.searchParams.get("code"));
  const rejectedTokenResponse = await deniedContext.request.post(origin + "/realms/baseharbor-browser/protocol/openid-connect/token", { form: { grant_type: "authorization_code", client_id: "baseharbor-console-wrong-audience", redirect_uri: origin + "/auth/callback", code: callback.searchParams.get("code"), code_verifier: verifier } });
  assert.equal(rejectedTokenResponse.status(), 200);
  const rejectedToken = await rejectedTokenResponse.json();
  assert.equal((await deniedContext.request.get(origin + "/api/v1/machine/discovery", { headers: { Authorization: "Bearer " + rejectedToken.access_token } })).status(), 401);
  await deniedContext.close();
  steps.push("actual-Core-rejects-real-issuer-token-with-wrong-audience");

  // One actual owned container, a separately authenticated editor, and the
  // real Core PTY. The fixture record is created only after the empty-read tests.
  execFileSync("bash", ["scripts/browser/start-terminal-fixture.sh"], { stdio: "pipe" });
  const terminalName = fs.readFileSync(path.join(root, "terminal.container"), "utf8").trim();
  const terminalId = execFileSync("docker", ["inspect", "--format", "{{.Id}}", terminalName], { encoding: "utf8" }).trim();
  const editor = await browser.newContext({ ignoreHTTPSErrors: true });
  const editorPage = await editor.newPage(); editorPage.setDefaultTimeout(20000);
  const terminalNetwork = [];
  editorPage.on("response", response => {
    const url = new URL(response.url());
    if (url.origin === origin && url.pathname.startsWith("/api/v1/machine/terminals") && terminalNetwork.length < 64) {
      terminalNetwork.push({ method: response.request().method(), status: response.status(), input: url.pathname.endsWith("/input") });
    }
  });
  await editorPage.goto(origin + "/runtime");
  const editorTokenReply = await captureTokenResponse(editorPage);
  const editorPopupPromise = editorPage.waitForEvent("popup");
  await editorPage.getByRole("button", { name: "Sign in", exact: true }).click();
  const editorPopup = await editorPopupPromise;
  await editorPopup.locator("#username").fill("browser-editor");
  await editorPopup.locator("#password").fill("isolated-browser-test-password");
  await editorPopup.locator("#kc-login").click();
  await editorPage.getByRole("button", { name: "Sign out", exact: true }).waitFor();
  const editorToken = await editorTokenReply.reply;
  await editorPage.getByLabel("Environment", { exact: true }).selectOption("dev");
  await editorPage.getByLabel("Core target (required)", { exact: true }).fill("browser-runtime");
  const editorList = await captureNativeJson(editorPage, /^https:\/\/localhost:8443\/api\/v1\/machine\/executions\/[^/?]+$/);
  await editorPage.getByRole("button", { name: "Read Core", exact: true }).click();
  const editorInventory = await editorList.reply;
  const owned = editorInventory.result.find(resource => resource.ref.resource_id === terminalId);
  assert.equal(owned.ownership, "managed"); assert.equal(owned.relationship.component, "shell");
  const terminalPanel = editorPage.locator("section").filter({ has: editorPage.getByRole("heading", { name: "Container terminal", exact: true }) });
  const terminalSelection = terminalPanel.getByLabel("Terminal resource", { exact: true });
  const terminalResources = editorInventory.result.filter(resource => resource.ref.kind === "container" && ["managed", "platform"].includes(resource.ownership));
  const terminalIndex = terminalResources.findIndex(resource => resource.ref.resource_id === terminalId);
  assert.ok(terminalIndex >= 0, "Core-owned terminal container is missing from the explicit selection");
  const selected = terminalSelection.locator(`option[value="${terminalIndex}"]`);
  await selected.waitFor({ state: "attached" });
  assert.equal(await selected.textContent(), owned.display_name || owned.runtime_name || owned.ref.resource_id);
  await terminalSelection.selectOption(String(terminalIndex));
  await terminalPanel.getByLabel("Container program", { exact: true }).fill("/bin/sh");
  await terminalPanel.getByLabel("Arguments (one per line)", { exact: true }).fill("-i");
  const opening = await captureNativeJson(editorPage, origin + "/api/v1/machine/terminals", 201);
  await terminalPanel.getByRole("button", { name: "Open terminal", exact: true }).click();
  const descriptor = await opening.reply;
  assert.equal(descriptor.actor.subject, "55555555-5555-4555-8555-555555555555");
  assert.equal(descriptor.resource_id, terminalId); assert.equal(descriptor.context.target, "browser-runtime");
  await terminalPanel.getByRole("status").filter({ hasText: "Connected" }).waitFor();
  await terminalPanel.locator(".xterm-screen").waitFor({ state: "visible" });
  async function expectTerminalLine(line) {
    try {
      await terminalPanel.locator(".xterm-accessibility-tree").getByText(line, { exact: true }).waitFor({ state: "attached" });
    } catch (failure) {
      // This isolated shell receives only the literal qualification commands.
      // Retain bounded rendered rows/statuses, never bearer or request payloads.
      console.error(JSON.stringify({ terminal_network: terminalNetwork,
        terminal_status: await terminalPanel.getByRole("status").allTextContents(),
        terminal_alert: await terminalPanel.getByRole("alert").allTextContents(),
        terminal_rows: (await terminalPanel.locator(".xterm-accessibility-tree > div").allTextContents()).slice(0, 24).map(value => value.slice(0, 256)) }));
      throw failure;
    }
  }
  const screen = terminalPanel.locator(".xterm-helper-textarea");
  // Connected admits the PTY transport, not arbitrary program readiness. BusyBox
  // performs terminal cursor-position negotiation before reading commands.
  // Observe its actual prompt before typing, as a user does; no timed sleep or
  // input replay can substitute for the native shell's readiness.
  await terminalPanel.locator(".xterm-accessibility-tree").getByText(/^~ \$\s*$/).waitFor({ state: "attached" });
  await screen.focus(); await editorPage.keyboard.type("echo terminal-ok", { delay: 35 }); await editorPage.keyboard.press("Enter");
  await expectTerminalLine("terminal-ok");
  const resized = editorPage.waitForResponse(response => response.url() === origin + "/api/v1/machine/terminals/" + descriptor.stream_id + "/input" && response.request().postDataJSON()?.kind === "resize");
  await editorPage.setViewportSize({ width: 960, height: 800 });
  const resizeAck = await resized; assert.equal(resizeAck.status(), 204);
  const resizeFrame = resizeAck.request().postDataJSON();
  await screen.focus(); await editorPage.keyboard.type("stty size", { delay: 35 }); await editorPage.keyboard.press("Enter");
  await expectTerminalLine(`${resizeFrame.rows} ${resizeFrame.columns}`);

  const foreign = await browser.newContext({ ignoreHTTPSErrors: true });
  const foreignPage = await foreign.newPage();
  await foreignPage.goto(origin + "/runtime");
  const foreignReply = await captureTokenResponse(foreignPage);
  const foreignPopupPromise = foreignPage.waitForEvent("popup");
  await foreignPage.getByRole("button", { name: "Sign in", exact: true }).click();
  const foreignPopup = await foreignPopupPromise;
  await foreignPopup.locator("#username").fill("browser-owner");
  await foreignPopup.locator("#password").fill("isolated-browser-test-password");
  await foreignPopup.locator("#kc-login").click();
  await foreignPage.getByRole("button", { name: "Sign out", exact: true }).waitFor();
  const foreignToken = await foreignReply.reply;
  const foreignHeaders = { Authorization: "Bearer " + foreignToken.access_token };
  const terminalUrl = origin + "/api/v1/machine/terminals/" + descriptor.stream_id;
  assert.equal((await foreign.request.delete(terminalUrl, { headers: foreignHeaders })).status(), 403);
  assert.equal((await foreign.request.post(terminalUrl + "/input", { headers: foreignHeaders, data: { contract_version: "v1", sequence: 1, kind: "input", data: Buffer.from("echo forbidden\n").toString("base64") } })).status(), 403);
  await foreign.close();
  await screen.focus(); await editorPage.keyboard.type("exit 7", { delay: 35 }); await editorPage.keyboard.press("Enter");
  await terminalPanel.getByRole("status").filter({ hasText: "Exited (7)" }).waitFor();
  await terminalPanel.getByRole("button", { name: "Close terminal", exact: true }).click();
  assert.equal((await editor.request.post(terminalUrl + "/input", { headers: { Authorization: "Bearer " + editorToken.access_token }, data: { contract_version: "v1", sequence: 1000, kind: "input", data: "eA==" } })).status(), 404);
  assert.ok(!execFileSync("docker", ["top", terminalName, "-eo", "args"], { encoding: "utf8" }).includes("/bin/sh -i"), "Core PTY process remained after exit");
  await editor.close();
  steps.push("actual-browser-Core-owned-container-PTY-input-output-resize-exit-and-foreign-actor-denial");

  const receipt = { schema: "baseharbor.private-browser-receipt/v1", repository: process.env.GITHUB_REPOSITORY,
    commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    core_commit: process.env.BASEHARBOR_BROWSER_CORE_COMMIT, run_id: process.env.GITHUB_RUN_ID, run_attempt: process.env.GITHUB_RUN_ATTEMPT,
    qualification_scope: "actual-browser-oidc-Core-read-runtime-details-terminal-and-logout", result: "success", steps,
    browser_version: browser.version(), keycloak_image: process.env.BASEHARBOR_BROWSER_KEYCLOAK_IMAGE,
    terminal_runtime_evidence: true, production_rotation_evidence: false, release_eligible: false };
  fs.writeFileSync(path.join(root, "browser-receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify({ result: "success", qualification_scope: receipt.qualification_scope, steps }));
} catch (error) {
  // Paths/statuses alone locate the failing boundary. No response body,
  // request header, authorization callback query or bearer is persisted.
  console.error(JSON.stringify({ result: "failure", completed_steps: steps, network: network.slice(-24), token_boundary: tokenBoundary, error_type: error?.name ?? "Error" }));
  throw error;
} finally { await context.close(); await browser.close(); }
