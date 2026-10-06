import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, test } from "node:test";
import { BaseHarborHttpTransport } from "../src/lib/baseharbor/client.ts";
import { decodeMachineDiscovery } from "../src/lib/baseharbor/discovery.ts";
import { CoreTerminal } from "../src/lib/baseharbor/terminal-session.ts";
import { decodeTerminalDescriptor, decodeTerminalEvent, validateTerminalSize } from "../src/lib/baseharbor/terminal-wire.ts";
import { decodeRuntimeCapabilities } from "../src/lib/baseharbor/read-models.ts";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
async function fixtures() {
  const control = JSON.parse(await readFile(new URL("../contracts/core-machine/v1/control.golden.json", import.meta.url), "utf8"));
  const models = JSON.parse(await readFile(new URL("../contracts/core-machine/v1/read-models.golden.json", import.meta.url), "utf8"));
  const wire = control.records.find((record: { record: string }) => record.record === "discovery").value;
  const discovery = decodeMachineDiscovery({ ...wire, capabilities: [...wire.capabilities, "streams.terminal"] }, "https://core.example");
  const descriptor = models.records.find((record: { operation: string }) => record.operation === "stream.descriptor").value;
  const events = models.records.filter((record: { operation: string }) => record.operation === "terminal.event").map((record: { value: unknown }) => record.value);
  return { discovery, descriptor, events, models };
}
const json = (value: unknown) => new Response(JSON.stringify(value));
function frame(event: { sequence: number; kind: string }) { return `id: ${event.sequence}\nevent: ${event.kind}\ndata: ${JSON.stringify(event)}\n\n`; }

test("actual Core terminal examples preserve binary data, exit and authenticated resource identity", async () => {
  const { descriptor, events, models } = await fixtures();
  assert.equal(decodeTerminalDescriptor(descriptor, descriptor.context, "container", descriptor.resource_id).actor.subject, "synthetic-operator");
  assert.equal(new TextDecoder().decode(decodeTerminalEvent(events[1], descriptor.stream_id).data), "synthetic output\r\n");
  assert.equal(decodeTerminalEvent(events[2], descriptor.stream_id).exit_code, 0);
  const capabilities = models.records.find((record: { operation: string }) => record.operation === "runtime.capabilities").value;
  assert.equal(decodeRuntimeCapabilities(capabilities, "synthetic-target").capabilities.includes("container.terminal"), true);
  assert.throws(() => decodeRuntimeCapabilities(capabilities, "foreign-target"));
  for (const change of [{ stream_id: "stream_" + "f".repeat(32) }, { sequence: 0 }, { kind: "terminal.done" }, { exit_code: 0 }, { data: "AAAA!" }, { data: "AB==" }, { data: "A".repeat(21852) }]) assert.throws(() => decodeTerminalEvent({ ...events[1], ...change }, descriptor.stream_id));
  assert.throws(() => decodeTerminalDescriptor({ ...descriptor, actor: { mode: "trusted_local" } }, descriptor.context, "container", descriptor.resource_id));
  assert.throws(() => decodeTerminalDescriptor(descriptor, { ...descriptor.context, target: "foreign" }, "container", descriptor.resource_id));
  for (const size of [[0, 80], [24, 513], [1.5, 80]]) assert.throws(() => validateTerminalSize(size[0], size[1]));
});

test("input and resize use one serialized non-replayable sequence and a correlated exit", async () => {
  const { discovery, descriptor, events } = await fixtures();
  const requests: Record<string, unknown>[] = [];
  let stream!: ReadableStreamDefaultController<Uint8Array>, closes = 0;
  const encoder = new TextEncoder();
  globalThis.fetch = async (_destination, init) => {
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer memory-token");
    if (init?.method === "DELETE") { closes++; return new Response(null, { status: 204 }); }
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      if (body.tty) { assert.deepEqual(body.command, ["/bin/cat"]); return json(descriptor); }
      requests.push(body); return new Response(null, { status: 204 });
    }
    return new Response(new ReadableStream({ start(controller) { stream = controller; controller.enqueue(encoder.encode(frame(events[0]))); } }), { headers: { "Content-Type": "text/event-stream" } });
  };
  const output: Uint8Array[] = []; let exit: number | undefined;
  const terminal = await CoreTerminal.open(new BaseHarborHttpTransport("https://core.example", () => "memory-token"), discovery, descriptor.context, "container", descriptor.resource_id, ["/bin/cat"], 24, 80, { output: bytes => { output.push(bytes); }, exit: code => { exit = code; }, error: error => assert.fail(error.message) }, new AbortController().signal);
  await Promise.all([terminal.write(new TextEncoder().encode("hello\r")), terminal.resize(30, 100)]);
  assert.deepEqual(requests.map(body => [body.sequence, body.kind]), [[1, "input"], [2, "resize"]]);
  assert.equal(atob(String(requests[0].data)), "hello\r");
  stream.enqueue(encoder.encode(frame(events[1]) + frame(events[2])));
  await terminal.done; assert.equal(new TextDecoder().decode(output[0]), "synthetic output\r\n"); assert.equal(exit, 0);
  await assert.rejects(() => terminal.write(new Uint8Array([1])));
  assert.equal(requests.length, 2); assert.equal(closes, 1);
});

test("an ambiguous input acknowledgement closes the terminal without retrying queued side effects", async () => {
  const { discovery, descriptor, events } = await fixtures();
  let inputs = 0, cancelled = false;
  globalThis.fetch = async (_destination, init) => {
    if (init?.method === "DELETE") return new Response(null, { status: 204 });
    if (init?.method === "POST") { if (JSON.parse(String(init.body)).tty) return json(descriptor); inputs++; throw new Error("connection lost after write"); }
    return new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(frame(events[0]))); }, cancel() { cancelled = true; } }), { headers: { "Content-Type": "text/event-stream" } });
  };
  const terminal = await CoreTerminal.open(new BaseHarborHttpTransport("https://core.example", () => "memory-token"), discovery, descriptor.context, "container", descriptor.resource_id, ["/bin/cat"], 24, 80, { output: () => {}, exit: () => assert.fail("invented exit"), error: () => {} }, new AbortController().signal);
  const results = await Promise.allSettled([terminal.write(new Uint8Array([1])), terminal.resize(24, 90)]);
  assert.equal(results.every(result => result.status === "rejected"), true);
  await terminal.done; assert.equal(inputs, 1); assert.equal(cancelled, true);
});

test("foreign or duplicated output closes observation without an invented exit or replay", async () => {
  const { discovery, descriptor, events } = await fixtures();
  for (const change of [{ stream_id: "stream_" + "f".repeat(32) }, { sequence: 1 }]) {
    let controller!: ReadableStreamDefaultController<Uint8Array>, errors = 0, posts = 0;
    globalThis.fetch = async (_destination, init) => {
      if (init?.method === "DELETE") return new Response(null, { status: 204 });
      if (init?.method === "POST") { posts++; return json(descriptor); }
      return new Response(new ReadableStream({ start(value) { controller = value; value.enqueue(new TextEncoder().encode(frame(events[0]))); } }), { headers: { "Content-Type": "text/event-stream" } });
    };
    const terminal = await CoreTerminal.open(new BaseHarborHttpTransport("https://core.example", () => "memory-token"), discovery, descriptor.context, "container", descriptor.resource_id, ["/bin/cat"], 24, 80, { output: () => assert.fail("accepted corrupt output"), exit: () => assert.fail("invented exit"), error: () => { errors++; } }, new AbortController().signal);
    controller.enqueue(new TextEncoder().encode(frame({ ...events[1], ...change })));
    await terminal.done; assert.equal(errors, 1); assert.equal(posts, 1);
  }
});

test("missing terminal transport capability fails before reading a credential or creating a process", async () => {
  const { discovery, descriptor } = await fixtures(); let credentials = 0, requests = 0;
  globalThis.fetch = async () => { requests++; throw new Error("unexpected request"); };
  await assert.rejects(() => CoreTerminal.open(new BaseHarborHttpTransport("https://core.example", () => { credentials++; return "token"; }), { ...discovery, capabilities: [] }, descriptor.context, "container", descriptor.resource_id, ["/bin/cat"], 24, 80, { output: () => {}, exit: () => {}, error: () => {} }, new AbortController().signal), /did not advertise/);
  assert.equal(credentials, 0); assert.equal(requests, 0);
});

test("bounded input queue closes on backpressure without dispatching buffered side effects", async () => {
  const { discovery, descriptor, events } = await fixtures(); let inputs = 0;
  globalThis.fetch = async (_destination, init) => {
    if (init?.method === "DELETE") return new Response(null, { status: 204 });
    if (init?.method === "POST") { if (JSON.parse(String(init.body)).tty) return json(descriptor); inputs++; return new Response(null, { status: 204 }); }
    return new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(frame(events[0]))); } }), { headers: { "Content-Type": "text/event-stream" } });
  };
  const terminal = await CoreTerminal.open(new BaseHarborHttpTransport("https://core.example", () => "token"), discovery, descriptor.context, "container", descriptor.resource_id, ["/bin/cat"], 24, 80, { output: () => {}, exit: () => assert.fail("invented exit"), error: () => {} }, new AbortController().signal);
  const results = await Promise.allSettled(Array.from({ length: 17 }, () => terminal.write(new Uint8Array([1]))));
  assert.equal(results.every(result => result.status === "rejected"), true); assert.equal(inputs, 0); await terminal.done;
});

test("session cancellation closes idle terminal output without replay or an invented exit", async () => {
  const { discovery, descriptor, events } = await fixtures(); let cancelled = false, opens = 0;
  globalThis.fetch = async (_destination, init) => {
    if (init?.method === "DELETE") return new Response(null, { status: 204 });
    if (init?.method === "POST") { opens++; return json(descriptor); }
    return new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(frame(events[0]))); }, cancel() { cancelled = true; } }), { headers: { "Content-Type": "text/event-stream" } });
  };
  const controller = new AbortController();
  const terminal = await CoreTerminal.open(new BaseHarborHttpTransport("https://core.example", () => "token"), discovery, descriptor.context, "container", descriptor.resource_id, ["/bin/cat"], 24, 80, { output: () => {}, exit: () => assert.fail("invented exit"), error: () => assert.fail("cancellation is not an error") }, controller.signal);
  controller.abort(); await terminal.done; assert.equal(cancelled, true); assert.equal(opens, 1); await assert.rejects(() => terminal.write(new Uint8Array([1])));
});

test("transport admission precedes first output so terminal query responses are retained", async () => {
  const { discovery, descriptor, events } = await fixtures();
  const requests: Record<string, unknown>[] = [];
  let admitted: CoreTerminal | undefined;
  const reply = new Uint8Array([27, 91, 49, 59, 49, 82]);
  globalThis.fetch = async (_destination, init) => {
    if (init?.method === "DELETE") return new Response(null, { status: 204 });
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      if (body.tty) return json(descriptor);
      requests.push(body); return new Response(null, { status: 204 });
    }
    return new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new TextEncoder().encode(frame(events[0]) + frame(events[1]) + frame(events[2])));
      controller.close();
    } }), { headers: { "Content-Type": "text/event-stream" } });
  };
  const terminal = await CoreTerminal.open(new BaseHarborHttpTransport("https://core.example", () => "memory-token"), discovery, descriptor.context, "container", descriptor.resource_id, ["/bin/cat"], 24, 80, {
    ready: terminal => { admitted = terminal; },
    output: async () => { assert.ok(admitted, "output reached the renderer before input admission"); await admitted.write(reply); },
    exit: () => {}, error: error => assert.fail(error.message),
  }, new AbortController().signal);
  await terminal.done;
  assert.equal(admitted, terminal);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].sequence, 1);
  assert.deepEqual(Uint8Array.from(atob(String(requests[0].data)), char => char.charCodeAt(0)), reply);
});
