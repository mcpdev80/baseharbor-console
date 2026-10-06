import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();
page.setDefaultTimeout(20000);
const executions = [];
page.on("response", async response => {
  const url = new URL(response.url());
  if (url.origin === origin && url.pathname.startsWith("/api/v1/machine/executions/") && response.request().method() === "GET" && !url.pathname.endsWith("/events")) {
    try { const value = await response.json(); if (value.state === "succeeded") executions.push(value); } catch { /* Core's SSE response is handled by the Console. */ }
  }
});
try {
  await page.goto(origin + "/applications");
  await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();
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
  await page.getByRole("button", { name: "Read Core", exact: true }).click();
  await page.getByText("Core returned no records.", { exact: true }).waitFor();
  assert.ok(executions.some(value => value.operation_id === "app.list" && value.actor?.subject === "22222222-2222-4222-8222-222222222222" && value.context?.environment === "dev" && value.result?.deployments?.length === 0), "No authoritative Core execution backs the displayed empty result");
  steps.push("actual-Core-POST-SSE-GET-and-empty-read-model");
  const persisted = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookies: document.cookie }));
  assert.ok(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./.test(JSON.stringify(persisted)), "Bearer material persisted in browser storage");
  steps.push("no-bearer-in-browser-storage");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
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
  await fresh.close();
  steps.push("fresh-context-has-no-Core-session");
  const receipt = { schema: "baseharbor.private-browser-receipt/v1", repository: process.env.GITHUB_REPOSITORY,
    commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    core_commit: process.env.BASEHARBOR_BROWSER_CORE_COMMIT, run_id: process.env.GITHUB_RUN_ID, run_attempt: process.env.GITHUB_RUN_ATTEMPT,
    qualification_scope: "actual-browser-oidc-Core-read-and-logout", result: "success", steps,
    browser_version: browser.version(), keycloak_image: process.env.BASEHARBOR_BROWSER_KEYCLOAK_IMAGE,
    terminal_runtime_evidence: false, production_rotation_evidence: false, release_eligible: false };
  fs.writeFileSync(path.join(root, "browser-receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify({ result: "success", qualification_scope: receipt.qualification_scope, steps }));
} finally { await context.close(); await browser.close(); }
