import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { decodeDeployments, decodeTargets, decodeWorkspaces, decodeRuntime } from "../src/lib/baseharbor/read-models.ts";

async function examples() { return JSON.parse(await readFile(new URL("../contracts/core-machine/v1/read-models.golden.json", import.meta.url), "utf8")); }

test("actual Core-generated result shapes decode without fabricated observation fields", async () => {
  const fixtures = await examples(); assert.equal(fixtures.synthetic, true);
  for (const record of fixtures.records) {
    const decoded = record.operation === "app.list" ? decodeDeployments(record.value) : record.operation === "target.list" ? decodeTargets(record.value) : record.operation === "workspace.list" ? decodeWorkspaces(record.value) : decodeRuntime(record.value, "synthetic-target");
    assert.equal(Object.isFrozen(decoded.rows), true);
    for (const row of decoded.rows) assert.equal(Object.isFrozen(row), true);
    if (record.operation === "target.list") assert.equal("health" in decoded.rows[0], false);
    if (record.operation === "app.list") for (const row of decoded.rows) assert.equal("updatedAt" in row, false);
    if (record.operation === "runtime.list" && record.value === null) assert.equal(decoded.rows.length, 0);
  }
});

test("unknown UI fields, invalid flags and unbound runtime identities cannot become live records", async () => {
  const fixtures = await examples();
  const target = fixtures.records.find((record: { operation: string }) => record.operation === "target.list").value;
  for (const changes of [{ health: "healthy" }, { effective: "yes" }, { runtime_provider: 42 }, { contract_version: "v2" }]) assert.throws(() => decodeTargets({ ...target, targets: [{ ...target.targets[0], ...changes }] }));
  const deployments = fixtures.records.find((record: { operation: string }) => record.operation === "app.list").value;
  for (const changes of [{ ready: "true" }, { source_available: null }, { desiredState: "running" }, { deployment_id: 42 }]) assert.throws(() => decodeDeployments({ ...deployments, deployments: [{ ...deployments.deployments[0], ...changes }] }));
  const resource = fixtures.records.find((record: { operation: string }) => record.operation === "runtime.list").value[0];
  assert.throws(() => decodeRuntime([resource], "foreign-target"));
  assert.throws(() => decodeRuntime([{ ...resource, relationship: {} }], "synthetic-target"));
  assert.throws(() => decodeRuntime([{ ...resource, state: { health: 1 } }], "synthetic-target"));
  assert.throws(() => decodeRuntime([{ ...resource, ref: { ...resource.ref, resource_id: "" } }], "synthetic-target"));
  assert.throws(() => decodeWorkspaces({ contract_version: "v1", workspaces: [{ contract_version: "v1", application: "app", manifest: "file", source_count: -1 }] }));
});
