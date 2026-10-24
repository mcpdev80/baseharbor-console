import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

// Execute the fixture's actual directory-preparation block under the hosted
// runner's permissive umask, including an existing isolated directory.
test("native fixture protects its Target configuration owner before Core starts", () => {
  const script = fs.readFileSync(new URL("../scripts/browser/start-fixture.sh", import.meta.url), "utf8");
  const block = script.match(/mkdir -p "\$XDG_CONFIG_HOME\/baseharbor"\n([\s\S]*?)cat > "\$XDG_CONFIG_HOME\/baseharbor\/config.yaml"/);
  assert.ok(block, "Target configuration preparation block not found");
  const preparation = block[0].slice(0, block[0].lastIndexOf("cat >"));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "browser-owner-mode-"));
  try {
    for (const existing of [false, true]) {
      const config = path.join(root, existing ? "existing" : "fresh");
      if (existing) { fs.mkdirSync(path.join(config, "baseharbor"), { recursive: true, mode: 0o755 }); fs.chmodSync(path.join(config, "baseharbor"), 0o755); }
      execFileSync("bash", ["-euc", "umask 022\n" + preparation], { env: { ...process.env, XDG_CONFIG_HOME: config }, stdio: "pipe" });
      const owner = fs.statSync(path.join(config, "baseharbor"));
      assert.equal(owner.mode & 0o777, 0o700, "Core requires a private Target configuration owner directory");
      if (process.getuid) assert.equal(owner.uid, process.getuid());
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
