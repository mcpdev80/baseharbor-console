import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("browser fixture setup and cleanup use normal exit results without CI receipts", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "baseharbor-browser-test-"));
  const env = { ...process.env, BASEHARBOR_BROWSER_FIXTURE: root };
  try {
    execFileSync(process.execPath, ["scripts/browser/prepare-realm.mjs"], { env });
    const realm = JSON.parse(fs.readFileSync(path.join(root, "realm/baseharbor-browser-realm.json"), "utf8"));
    assert.equal(realm.realm, "baseharbor-browser");
    assert.equal(realm.clients[0].attributes["pkce.code.challenge.method"], "S256");
    assert.deepEqual(fs.readdirSync(root), ["realm"]);
    execFileSync("bash", ["scripts/browser/stop-fixture.sh"], { env });
    assert.deepEqual(fs.readdirSync(root), []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
