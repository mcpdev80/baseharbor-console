import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { BaseHarborHttpTransport } from "../src/lib/baseharbor/client.ts";
import { decodeMachineDiscovery, discoverMachine, resolveMachineBinding } from "../src/lib/baseharbor/discovery.ts";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

// Source contract fixture, never runtime/browser or release evidence.
function wire() {
  return { contract_version: "v1", execution_version: "v1",
    operations: [{ id: "status", description: "Read semantic state", safety: "read_only",
      confirmation_required: false, policy_required: false, contract_version: "v1" }],
    capabilities: ["events.sse"], http: {
      execute: { method: "POST", href: "/machine-executions" },
      execution: { method: "GET", href: "/machine-executions/{execution_id}" },
      execution_events: { method: "GET", href: "/machine-executions/{execution_id}/events", protocol: "sse" },
      terminal_input: { method: "POST", href: "/terminal-sessions/{stream_id}/input" },
    } };
}

test("authenticated discovery supplies all subsequent endpoints without path inference", async () => {
  let calls = 0;
  globalThis.fetch = async (destination, init) => {
    assert.equal(String(destination), "https://core.example/api/v1/machine/discovery");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer credential");
    calls++;
    return new Response(JSON.stringify(wire()), { headers: { "Content-Type": "application/json" } });
  };
  const discovery = await discoverMachine(new BaseHarborHttpTransport("https://core.example", () => "credential"), "https://core.example");
  assert.equal(calls, 1);
  assert.equal(resolveMachineBinding(discovery, "execute").href, "/machine-executions");
  assert.equal(resolveMachineBinding(discovery, "execution_events", { execution_id: "exec_" + "a".repeat(32) }).href, "/machine-executions/exec_" + "a".repeat(32) + "/events");
  assert.equal(Object.isFrozen(discovery.http.execute), true);
  assert.equal(Object.isFrozen(discovery.operations[0]), true);
  assert.throws(() => resolveMachineBinding(discovery, "not_advertised"));
  for (const id of ["../../foreign", "stream_" + "a".repeat(32), "exec_short", "exec_" + "a".repeat(32) + "?token=x"]) {
    assert.throws(() => resolveMachineBinding(discovery, "execution", { execution_id: id }));
  }
});

test("unsafe or incompatible discovery cannot become credential-bearing requests", () => {
  for (const href of ["//foreign.example/x", "https://foreign.example/x", "/x?access_token=x", "/x#fragment", "/x\\foreign", "/x/{unknown}", "/x/{execution_id"] ) {
    const value = wire(); value.http.execute.href = href;
    assert.throws(() => decodeMachineDiscovery(value, "https://core.example"));
  }
  const duplicate = wire(); duplicate.operations.push({ ...duplicate.operations[0] });
  assert.throws(() => decodeMachineDiscovery(duplicate, "https://core.example"));
  const wrongVersion = wire(); wrongVersion.execution_version = "v2";
  assert.throws(() => decodeMachineDiscovery(wrongVersion, "https://core.example"));
  const wrongSafety = wire(); wrongSafety.operations[0].safety = "safe";
  assert.throws(() => decodeMachineDiscovery(wrongSafety, "https://core.example"));
  const missingFlags: unknown = { ...wire(), operations: [{ id: "status", description: "Read", safety: "read_only", contract_version: "v1" }] };
  assert.throws(() => decodeMachineDiscovery(missingFlags, "https://core.example"));
});
