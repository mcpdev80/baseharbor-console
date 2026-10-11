import assert from "node:assert/strict";
import test from "node:test";
import { coreKeycloakImage } from "../scripts/browser/core-keycloak-image.mjs";

const image = "quay.io/keycloak/keycloak:26.8.0@sha256:" + "b".repeat(64);

test("the browser uses the canonical digest rather than choosing a floating image tag", () => {
  assert.equal(coreKeycloakImage(`const (\n\tKeycloakImage      = "${image}"\n)`), image);
  for (const invalid of [image.split("@")[0], "foreign.test/keycloak:26.8.0@sha256:" + "b".repeat(64), image + "\nOUTPUT=injected"]) {
    assert.throws(() => coreKeycloakImage(`KeycloakImage = "${invalid}"`));
  }
  assert.throws(() => coreKeycloakImage("// KeycloakImage is missing"));
  assert.throws(() => coreKeycloakImage(`KeycloakImage = "${image}"\nKeycloakImage = "${image}"`));
});
