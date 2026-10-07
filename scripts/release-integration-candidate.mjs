import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const exactCommit = /^[0-9a-f]{40}$/;
const candidatePrefix = "release-integration/v0.4.23/core/";

// The immutable consumer source remains pinned by Core. Only the explicit
// trusted push branch supplies the exact Core to qualify, avoiding mutually
// recursive Core/consumer commit pins. Contracts still require byte equality.
export function releaseCoreCandidate(ref, sourceLock) {
  assert.equal(sourceLock.schema, "baseharbor.public-consumer-source-lock/v1");
  assert.match(sourceLock.core_commit, exactCommit);
  assert.match(ref, /^release-integration\//);
  if (!ref.startsWith(candidatePrefix)) return sourceLock.core_commit;
  const candidate = ref.slice(candidatePrefix.length);
  assert.match(candidate, exactCommit);
  return candidate;
}

export function releaseDemoCandidate(value) {
  const candidate = value.trim();
  assert.match(candidate, exactCommit);
  return candidate;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  assert.equal(process.env.GITHUB_EVENT_NAME, "push");
  assert.equal(process.env.GITHUB_REPOSITORY, "mcpdev80/baseharbor-console");
  const lock = JSON.parse(fs.readFileSync("contracts/core-machine/v1/source-lock.json", "utf8"));
  const core = releaseCoreCandidate(process.env.GITHUB_REF_NAME, lock);
  if (process.argv[2] === "demo") {
    const actual = execFileSync("git", ["-C", ".release-core-source", "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    assert.equal(actual, core);
    const demo = releaseDemoCandidate(fs.readFileSync(".release-core-source/docs/releases/v0.4.23.demo-ref", "utf8"));
    process.stdout.write("demo=" + demo + "\n");
  } else {
    assert.ok(process.argv[2] === undefined || process.argv[2] === "core");
    process.stdout.write("core=" + core + "\n");
  }
}
