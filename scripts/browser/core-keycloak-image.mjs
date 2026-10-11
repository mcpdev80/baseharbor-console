import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Use the provider's immutable selection from the already verified Core source.
// The browser fixture does not choose an independent version or resolve a tag.
export function coreKeycloakImage(source) {
  const declarations = [...source.matchAll(/^\s*KeycloakImage\s*=\s*"([^"]+)"\s*$/gm)];
  assert.equal(declarations.length, 1, "One canonical Core Keycloak image is required");
  const image = declarations[0][1];
  assert.match(image, /^quay\.io\/keycloak\/keycloak:[A-Za-z0-9._-]+@sha256:[0-9a-f]{64}$/);
  return image;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  assert.equal(process.argv.length, 3);
  const source = fs.readFileSync(path.join(process.argv[2], "internal/identityprovider/keycloak_files.go"), "utf8");
  process.stdout.write(coreKeycloakImage(source) + "\n");
}
