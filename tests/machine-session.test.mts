import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, test } from "node:test";
import { BaseHarborHttpTransport } from "../src/lib/baseharbor/client.ts";
import { MachineSession } from "../src/lib/baseharbor/machine-session.ts";
import { decodeMachineExecution, decodeMachineEvent, decodeMachineError } from "../src/lib/baseharbor/machine-wire.ts";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
// Exact public Core-generated examples. These source tests are not browser,
// authentication, deployment or release qualification.
async function fixtures() {
  return JSON.parse(await readFile(new URL("../contracts/core-machine/v1/control.golden.json", import.meta.url), "utf8"));
}

test("Core-generated execution, event and error examples decode without UI aliases", async () => {
  const examples = await fixtures();
  assert.equal(examples.synthetic, true);
  for (const record of examples.records) {
    if (record.record === "execution") assert.equal(decodeMachineExecution(record.value).execution_id, record.value.execution_id);
    if (record.record === "event") assert.equal(decodeMachineEvent(record.value).kind, record.value.kind);
    if (record.record === "error_result") assert.equal(decodeMachineError(record.value.error).code, "policy_denied");
  }
});

test("invalid identities, states, typed failures, context and event sequence are rejected", async () => {
  const examples = await fixtures();
  const execution = examples.records.find((r: { record: string; value: { state?: string } }) => r.record === "execution" && r.value.state === "pending").value;
  for (const change of [
    { contract_version: "v2" }, { execution_id: "../../foreign" }, { actor: null }, { context: { tenant: "foreign" } },
    { state: "success" }, { state: "succeeded" }, { state: "failed" }, { started_at: "yesterday" }, { unknown: true },
  ]) assert.throws(() => decodeMachineExecution({ ...execution, ...change }));
  const event = examples.records.find((r: { record: string }) => r.record === "event").value;
  for (const change of [{ sequence: 0 }, { sequence: Number.MAX_SAFE_INTEGER + 1 }, { kind: "invented" }, { occurred_at: "yesterday" }, { progress: { current: "1" } }]) assert.throws(() => decodeMachineEvent({ ...event, ...change }));
});

test("discovered execution and authenticated SSE preserve selection and never replay a corrupt stream", async () => {
  const examples = await fixtures();
  const discovery = examples.records.find((r: { record: string }) => r.record === "discovery").value;
  const pending = examples.records.find((r: { record: string; value: { state?: string } }) => r.record === "execution" && r.value.state === "pending").value;
  const event = examples.records.find((r: { record: string }) => r.record === "event").value;
  const encoder = new TextEncoder();
  let calls = 0;
  globalThis.fetch = async (destination, init) => {
    calls++;
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer memory-credential");
    if (calls === 1) return new Response(JSON.stringify(discovery), { headers: { "Content-Type": "application/json" } });
    if (calls === 2) {
      assert.equal(String(destination), "https://core.example" + discovery.http.execute.href);
      assert.equal(init?.method, "POST");
      assert.deepEqual(JSON.parse(String(init?.body)), { operation_id: "status", context: pending.context, input: {} });
      return new Response(JSON.stringify(pending), { status: 202, headers: { "Content-Type": "application/json" } });
    }
    const invalid = { ...event, sequence: 2, execution_id: "exec_" + "f".repeat(32) };
    const frame = (value: typeof event) => `id: ${value.sequence}\nevent: ${value.kind}\ndata: ${JSON.stringify(value)}\n\n`;
    return new Response(new ReadableStream({ start(controller) { controller.enqueue(encoder.encode(frame(event) + frame(invalid))); controller.close(); } }), { headers: { "Content-Type": "text/event-stream" } });
  };
  const session = await MachineSession.connect(new BaseHarborHttpTransport("https://core.example", () => "memory-credential"), "https://core.example");
  await assert.rejects(() => session.execute("not.advertised", pending.context));
  await assert.rejects(() => session.execute("status", {}));
  assert.equal(calls, 1);
  const execution = await session.execute("status", { ...pending.context, environment: " PROD " });
  let accepted = 0, failures = 0;
  const stream = session.watchExecution(execution, () => accepted++, () => failures++);
  await stream.done;
  assert.equal(accepted, 1); assert.equal(failures, 1); assert.equal(calls, 3);
});

test("status cannot substitute another execution or accept a context mismatch", async () => {
  const examples = await fixtures();
  const discovery = examples.records.find((r: { record: string }) => r.record === "discovery").value;
  const pending = examples.records.find((r: { record: string; value: { state?: string } }) => r.record === "execution" && r.value.state === "pending").value;
  let calls = 0;
  globalThis.fetch = async () => new Response(JSON.stringify(calls++ === 0 ? discovery : pending));
  const session = await MachineSession.connect(new BaseHarborHttpTransport("https://core.example", () => "credential"), "https://core.example");
  await assert.rejects(() => session.execution("exec_" + "f".repeat(32)));
  await assert.rejects(() => session.execute("status", { environment: "different" }));
});

test("ending the Core session cancels idle observation and prevents further credential use", async () => {
  const examples = await fixtures();
  const discovery = examples.records.find((r: { record: string }) => r.record === "discovery").value;
  const pending = examples.records.find((r: { record: string; value: { state?: string } }) => r.record === "execution" && r.value.state === "pending").value;
  let calls = 0, cancelled = false;
  globalThis.fetch = async () => calls++ === 0 ? new Response(JSON.stringify(discovery)) : new Response(new ReadableStream({ cancel() { cancelled = true; } }), { headers: { "Content-Type": "text/event-stream" } });
  const session = await MachineSession.connect(new BaseHarborHttpTransport("https://core.example", () => "credential"), "https://core.example");
  const stream = session.watchExecution(decodeMachineExecution(pending), () => assert.fail("invented observation"), () => assert.fail("cancellation reported as failure"));
  await new Promise(resolve => setImmediate(resolve));
  session.close(); await stream.done;
  assert.equal(cancelled, true);
  await assert.rejects(() => session.execution(pending.execution_id));
  assert.throws(() => session.watchExecution(decodeMachineExecution(pending), () => {}, () => {}));
  assert.equal(calls, 2);
});
