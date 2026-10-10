import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, test } from "node:test";
import { BaseHarborHttpTransport } from "../src/lib/baseharbor/client.ts";
import { decodeMachineDiscovery } from "../src/lib/baseharbor/discovery.ts";
import { maxLogCharacters, openCoreLogs, retainLogOutput } from "../src/lib/baseharbor/log-stream.ts";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
async function discovery() {
  const control = JSON.parse(await readFile(new URL("../contracts/core-machine/v1/control.golden.json", import.meta.url), "utf8"));
  return decodeMachineDiscovery(control.records.find((row: { record: string }) => row.record === "discovery").value, "https://core.example");
}
const context = { environment: "dev", target: "selected-target" };
function headers(changes: Record<string, string> = {}) {
  return { "Content-Type": "text/plain; charset=utf-8", "X-BaseHarbor-Stream-ID": "stream_" + "a".repeat(32), "X-BaseHarbor-Stream-Kind": "logs", "X-BaseHarbor-Resource-Kind": "container", "X-BaseHarbor-Resource-ID": "owned", "X-BaseHarbor-Target": context.target, "X-BaseHarbor-Actor-Subject": "operator", ...changes };
}

test("logs use one discovered authenticated POST and preserve split UTF-8 under renderer backpressure", async () => {
  let calls = 0, admitted = false, ended = false;
  const output: string[] = [];
  globalThis.fetch = async (_url, init) => {
    calls++;
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer memory-token");
    assert.equal(init?.method, "POST"); assert.equal(init?.credentials, "omit");
    assert.deepEqual(JSON.parse(String(init?.body)), { contract_version: "v1", kind: "logs", context: { ...context, resource: "owned" }, resource_kind: "container", resource_id: "owned", tail: 100, follow: false });
    return new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new Uint8Array([0xc3])); controller.enqueue(new Uint8Array([0xb6, 10])); controller.close();
    } }), { headers: headers() });
  };
  const stream = openCoreLogs(new BaseHarborHttpTransport("https://core.example", () => "memory-token"), await discovery(), context, "owned", false, {
    ready: () => { admitted = true; }, output: async text => { assert.ok(admitted); output.push(text); }, end: () => { ended = true; }, error: error => assert.fail(error.message),
  }, new AbortController().signal);
  await stream.done;
  assert.equal(calls, 1); assert.equal(ended, true); assert.equal(output.join(""), "ö\n");
});

test("foreign stream headers fail closed before output and cancel the response without replay", async () => {
  let calls = 0, cancelled = false, failed = false;
  globalThis.fetch = async () => { calls++; return new Response(new ReadableStream({ cancel() { cancelled = true; } }), { headers: headers({ "X-BaseHarbor-Resource-ID": "foreign" }) }); };
  const stream = openCoreLogs(new BaseHarborHttpTransport("https://core.example", () => "memory-token"), await discovery(), context, "owned", true, {
    ready: () => assert.fail("foreign admission"), output: () => assert.fail("foreign data"), end: () => assert.fail("invented completion"), error: () => { failed = true; },
  }, new AbortController().signal);
  await stream.done; assert.equal(calls, 1); assert.equal(cancelled, true); assert.equal(failed, true);
});

test("stopping an admitted idle follow cancels its reader without reconnect or invented completion", async () => {
  let calls = 0, cancelled = false;
  let admit!: () => void;
  const admitted = new Promise<void>(resolve => { admit = resolve; });
  globalThis.fetch = async () => { calls++; return new Response(new ReadableStream({ cancel() { cancelled = true; } }), { headers: headers() }); };
  const controller = new AbortController();
  const stream = openCoreLogs(new BaseHarborHttpTransport("https://core.example", () => "memory-token"), await discovery(), context, "owned", true, {
    ready: admit, output: () => assert.fail("invented data"), end: () => assert.fail("invented completion"), error: error => assert.fail(error.message),
  }, controller.signal);
  await admitted; controller.abort(); await stream.done;
  assert.equal(calls, 1); assert.equal(cancelled, true);
});

test("malformed UTF-8 and oversized chunks cannot become live log text", async () => {
  for (const data of [new Uint8Array([0xff]), new Uint8Array(256 * 1024 + 1)]) {
    let failed = false, calls = 0;
    globalThis.fetch = async () => { calls++; return new Response(new ReadableStream({ start(controller) { controller.enqueue(data); controller.close(); } }), { headers: headers() }); };
    const stream = openCoreLogs(new BaseHarborHttpTransport("https://core.example", () => "memory-token"), await discovery(), context, "owned", true, {
      ready: () => {}, output: () => assert.fail("invalid text"), end: () => assert.fail("invented completion"), error: () => { failed = true; },
    }, new AbortController().signal);
    await stream.done; assert.equal(failed, true); assert.equal(calls, 1);
  }
});

test("incompatible discovery and resource context fail before reading a credential", async () => {
  const wire = await discovery(); let tokens = 0;
  const transport = new BaseHarborHttpTransport("https://core.example", () => { tokens++; return "memory-token"; });
  const callbacks = { ready: () => {}, output: () => {}, end: () => {}, error: () => {} };
  assert.throws(() => openCoreLogs(transport, { ...wire, http: { ...wire.http, logs: { ...wire.http.logs, method: "GET" } } }, context, "owned", true, callbacks, new AbortController().signal));
  assert.throws(() => openCoreLogs(transport, wire, { ...context, resource: "foreign" }, "owned", true, callbacks, new AbortController().signal));
  assert.equal(tokens, 0);
});

test("log retention stays bounded and preserves the newest complete Unicode text", () => {
  assert.equal(retainLogOutput("old".repeat(maxLogCharacters), "latest\n").endsWith("latest\n"), true);
  assert.equal(retainLogOutput("x".repeat(maxLogCharacters), "y").length, maxLogCharacters);
  const split = retainLogOutput("😀", "x".repeat(maxLogCharacters - 1));
  assert.equal(split.length, maxLogCharacters - 1); assert.equal(split.startsWith("x"), true);
});
