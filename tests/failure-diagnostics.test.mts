import test from "node:test";
import assert from "node:assert/strict";
import { safeDiagnosticText, safePublicError, observeOwnedOpenBao } from "../scripts/browser/failure-diagnostics.mjs";

test("public failure diagnostics retain actionable cause while removing credentials and paths", () => {
  const raw = 'Core secrets failed: context deadline exceeded; password=private-password token="private-token" Bearer private-bearer postgres://user:password@host/db /owned/recovery/file.json hvs.private-token abcdefgh.ijklmnop.qrstuvwx -----BEGIN PRIVATE KEY-----\nprivate-key\n-----END PRIVATE KEY-----';
  const safe = safeDiagnosticText(raw)!;
  assert.match(safe, /Core secrets failed: context deadline exceeded/);
  for (const secret of ["private-password", "private-token", "private-bearer", "user:password", "/owned/", "private-key", "abcdefgh.ijklmnop.qrstuvwx"]) assert.ok(!safe.includes(secret));
  assert.equal(safeDiagnosticText("x".repeat(100000))!.length <= 2048, true);
  assert.equal(safeDiagnosticText(null), undefined);
  assert.deepEqual(safePublicError({ code: "internal_error", cause: "bad cause", message: "permission denied", next: "Inspect status", secret: "never-copy" }), { code: "internal_error", cause: undefined, message: "permission denied", next: "Inspect status" });
});

test("owned OpenBao diagnosis executes exactly one read and persists only public status flags", () => {
  let calls = 0;
  const result = observeOwnedOpenBao("/isolated", (binary, args, options) => {
    calls++; assert.equal(binary, "/isolated/baha");
    assert.deepEqual(args, ["--target", "browser-runtime", "openbao", "status", "--json"]);
    assert.equal(options.env.XDG_DATA_HOME, "/isolated/data");
    assert.equal(options.env.XDG_CONFIG_HOME, "/isolated/config");
    assert.equal(options.timeout, 35000);
    return JSON.stringify({ initialized: true, unsealed: false, manager_ready: false, private: "never-copy" });
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, { outcome: "observed", initialized: true, unsealed: false, manager_ready: false });
});

test("failed or malformed status stays failed without raw output or mutation retry", () => {
  let calls = 0;
  const run = () => { calls++; throw { status: 1, stderr: Buffer.from(JSON.stringify({ error: { code: "internal_error", message: "connection refused password=hidden" }, private: "never-copy" })), stdout: "private-stdout" }; };
  const result = observeOwnedOpenBao("/isolated", run);
  assert.equal(calls, 1); assert.equal(result.outcome, "unavailable");
  assert.match(result.error.message, /connection refused/); assert.ok(!JSON.stringify(result).includes("hidden"));
  assert.ok(!JSON.stringify(result).includes("never-copy")); assert.ok(!JSON.stringify(result).includes("private-stdout"));
  assert.deepEqual(observeOwnedOpenBao("/isolated", () => '{"initialized":"yes"}'), { outcome: "invalid-status" });
  assert.deepEqual(observeOwnedOpenBao("/isolated", () => { throw { code: "ETIMEDOUT", stderr: "RAW PRIVATE" }; }), { outcome: "unavailable", exit_status: undefined, timed_out: true });
});
