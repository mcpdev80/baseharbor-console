import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { BaseHarborApiError, BaseHarborHttpTransport, resolveCoreDestination } from "../src/lib/baseharbor/client.ts";

const originalFetch = globalThis.fetch;

test("Core JSON rejects oversized and invalid UTF-8 bodies and closes the response", async () => {
  for (const bytes of [new Uint8Array(4 * 1024 * 1024 + 1), new Uint8Array([255])]) {
    let cancelled = false;
    globalThis.fetch = async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(bytes); }, cancel() { cancelled = true; } }));
    const transport = new BaseHarborHttpTransport("https://core.example", () => "credential");
    await assert.rejects(() => transport.request({ href: "/discovered" }, value => value));
    assert.equal(cancelled, true);
  }
});
afterEach(() => { globalThis.fetch = originalFetch; });

test("unsafe destinations fail before reading a token", async () => {
  let tokenReads = 0;
  const transport = new BaseHarborHttpTransport("https://core.example/", () => { tokenReads++; return "credential"; });
  for (const href of ["http://core.example/x", "https://foreign.example/x", "//foreign.example/x", "https://user:secret@core.example/x", "/x?access_token=secret", "/x#fragment"]) {
    await assert.rejects(transport.open({ href }));
  }
  assert.equal(tokenReads, 0);
  assert.equal(resolveCoreDestination("/operations", "https://core.example/").origin, "https://core.example");
});

test("bearer transport forbids cookies, redirects and credential overrides", async () => {
  let options: RequestInit | undefined;
  globalThis.fetch = async (_url, init) => { options = init; return new Response('{"value":1}', { status: 200 }); };
  const transport = new BaseHarborHttpTransport("https://core.example", () => "credential");
  const result = await transport.request({ href: "/operations", method: "POST", body: { input: true } }, (wire) => {
    assert.deepEqual(wire, { value: 1 }); return wire;
  });
  assert.deepEqual(result, { value: 1 });
  assert.equal(options?.credentials, "omit");
  assert.equal(options?.redirect, "error");
  assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer credential");
  await assert.rejects(transport.open({ href: "/x", headers: { Authorization: "Bearer other" } }));
});

test("missing authentication and Core errors remain failures", async () => {
  const unauthenticated = new BaseHarborHttpTransport("https://core.example");
  await assert.rejects(unauthenticated.open({ href: "/operations" }), (error) => error instanceof BaseHarborApiError && error.status === 401);
  const transport = new BaseHarborHttpTransport("https://core.example", () => "credential");
  globalThis.fetch = async () => new Response('{"code":"policy_denied","message":"denied"}', { status: 403 });
  await assert.rejects(transport.open({ href: "/operations" }), (error) => error instanceof BaseHarborApiError && error.status === 403);
  globalThis.fetch = async () => new Response("plain error", { status: 500 });
  await assert.rejects(transport.open({ href: "/operations" }), (error) => error instanceof BaseHarborApiError && error.status === 500);
});

test("wire validation is mandatory and cancellation is preserved", async () => {
  const transport = new BaseHarborHttpTransport("https://core.example", () => "credential");
  const controller = new AbortController();
  globalThis.fetch = async (_url, init) => { assert.equal(init?.signal, controller.signal); return new Response('{"wrong":true}'); };
  await assert.rejects(transport.request({ href: "/operations", signal: controller.signal }, () => { throw new Error("invalid Core wire"); }), /invalid Core wire/);
});
