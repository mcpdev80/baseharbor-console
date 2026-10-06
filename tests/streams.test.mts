import assert from "node:assert/strict";
import { test } from "node:test";
import { readEventStream } from "../src/lib/baseharbor/streams.ts";

function chunks(values: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream({ start(controller) {
    for (const value of values) controller.enqueue(new TextEncoder().encode(value));
    controller.close();
  }});
}

test("SSE decodes split CRLF and multiline data with canonical event kind", async () => {
  const events: unknown[] = [];
  await readEventStream(chunks(["id: 1\r", "\nevent: operation.succeeded\r\ndata: {\n", "data:   \"state\":\"succeeded\"}\r\n\r\n"]), (data, kind, id) => events.push({ data, kind, id }));
  assert.deepEqual(events, [{ data: '{\n  "state":"succeeded"}', kind: "operation.succeeded", id: "1" }]);
});

test("SSE rejects oversized and truncated events instead of inventing success", async () => {
  await assert.rejects(readEventStream(chunks(["data: " + "x".repeat(65536)]), () => {}), /bounded stream limit/);
  await assert.rejects(readEventStream(chunks(["data: incomplete\n"]), () => {}), /incomplete event/);
});

test("disconnect cancels an idle stream without automatic replay", async () => {
  let cancelled = false;
  const controller = new AbortController();
  const stream = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
  const read = readEventStream(stream, () => { throw new Error("unexpected replay"); }, controller.signal);
  controller.abort();
  await read;
  assert.equal(cancelled, true);
});
