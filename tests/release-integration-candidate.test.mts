import assert from "node:assert/strict";
import test from "node:test";
import { releaseCoreCandidate, releaseDemoCandidate } from "../scripts/release-integration-candidate.mjs";

const original = "a".repeat(40), candidate = "b".repeat(40);
const lock = { schema: "baseharbor.public-consumer-source-lock/v1", core_commit: original };

test("trusted exact-candidate push keeps immutable consumer source independent of Core pin", () => {
  assert.equal(releaseCoreCandidate("release-integration/v0.4.23/core/" + candidate, lock), candidate);
  assert.equal(releaseCoreCandidate("release-integration/v0.4.23-current-core-bootstrap", lock), original);
  assert.equal(releaseDemoCandidate(candidate + "\n"), candidate);
});

test("candidate selection refuses mutable refs, malformed hashes and output injection", () => {
  for (const ref of ["main", "feature/v0.4.23", "release-integration/v0.4.23/core/develop",
    "release-integration/v0.4.23/core/" + candidate.toUpperCase(),
    "release-integration/v0.4.23/core/" + candidate + "/extra",
    "release-integration/v0.4.23/core/" + candidate + "\ndemo=" + original]) {
    assert.throws(() => releaseCoreCandidate(ref, lock));
  }
  for (const value of ["develop", candidate + "\n" + original, candidate + "\ndemo=" + original]) {
    assert.throws(() => releaseDemoCandidate(value));
  }
  assert.throws(() => releaseCoreCandidate("release-integration/test", { ...lock, core_commit: "main" }));
  assert.throws(() => releaseCoreCandidate("release-integration/test", { ...lock, schema: "other" }));
});
