import { BaseHarborHttpTransport } from "./client.ts";
import type { MachineDiscovery } from "./discovery.ts";
import { resolveMachineBinding } from "./discovery.ts";
import { decodeMachineContext } from "./machine-wire.ts";
import type { MachineContext } from "./machine-wire.ts";
import type { StreamHandle } from "./streams.ts";

export interface LogCallbacks {
  ready(): void;
  output(text: string): void | Promise<void>;
  end(): void;
  error(error: Error): void;
}

export const maxLogCharacters = 64 * 1024;
export function retainLogOutput(previous: string, next: string): string {
  const value = (previous + next).slice(-maxLogCharacters);
  // Truncation must not leave half of a Unicode surrogate pair at the front.
  return value.length && value.charCodeAt(0) >= 0xdc00 && value.charCodeAt(0) <= 0xdfff ? value.slice(1) : value;
}

// One authenticated discovered POST stream; no cookies, automatic reconnect,
// URL credentials or fallback runtime. Stopping cancels the same request.
export function openCoreLogs(transport: BaseHarborHttpTransport, discovery: MachineDiscovery, selectedContext: MachineContext, resourceId: string, follow: boolean, callbacks: LogCallbacks, signal: AbortSignal): StreamHandle {
  const binding = resolveMachineBinding(discovery, "logs");
  if (binding.method !== "POST" || binding.protocol !== "text") throw new Error("Core log transport is incompatible");
  const selected = decodeMachineContext(selectedContext);
  if (!selected.environment?.trim() || !selected.target?.trim() || !resourceId || resourceId.length > 4096 || selected.resource !== undefined && selected.resource !== resourceId || typeof follow !== "boolean") throw new Error("Select one container, target and environment for logs");
  const context = Object.freeze({ ...selected, environment: selected.environment.trim().toLowerCase(), resource: resourceId });
  const controller = new AbortController();
  let closed = false;
  const close = () => { if (closed) return; closed = true; controller.abort(); };
  signal.addEventListener("abort", close, { once: true });
  if (signal.aborted) close();
  const done = (async () => {
    if (closed) { signal.removeEventListener("abort", close); return; }
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    const cancelReader = () => { void reader?.cancel().catch(() => undefined); };
    const deadline = setTimeout(() => controller.abort(new Error("Core log admission deadline exceeded")), 15000);
    try {
      const response = await transport.open({ ...binding, body: { contract_version: "v1", kind: "logs", context, resource_kind: "container", resource_id: resourceId, tail: 100, follow }, signal: controller.signal });
      clearTimeout(deadline);
      const headers = response.headers;
      if (response.status !== 200 || headers.get("Content-Type")?.toLowerCase().replace(/\s/g, "") !== "text/plain;charset=utf-8" ||
          !/^stream_[a-f0-9]{32}$/.test(headers.get("X-BaseHarbor-Stream-ID") || "") || headers.get("X-BaseHarbor-Stream-Kind") !== "logs" ||
          headers.get("X-BaseHarbor-Resource-Kind") !== "container" || headers.get("X-BaseHarbor-Resource-ID") !== resourceId || headers.get("X-BaseHarbor-Target") !== context.target ||
          !headers.get("X-BaseHarbor-Actor-Subject")?.trim() || (headers.get("X-BaseHarbor-Actor-Subject")?.length ?? 0) > 4096 || !response.body) {
        await response.body?.cancel();
        throw new Error("Core log stream identity or content differs");
      }
      reader = response.body.getReader();
      controller.signal.addEventListener("abort", cancelReader, { once: true });
      if (controller.signal.aborted) { cancelReader(); if (!closed) throw controller.signal.reason; return; }
      callbacks.ready();
      const decoder = new TextDecoder("utf-8", { fatal: true });
      while (!controller.signal.aborted) {
        const chunk = await reader.read();
        if (controller.signal.aborted) break;
        if (chunk.done) {
          const final = decoder.decode();
          if (final) await callbacks.output(final);
          if (!controller.signal.aborted) callbacks.end();
          break;
        }
        if (chunk.value.byteLength > 256 * 1024) throw new Error("Core log chunk exceeds its bound");
        const text = decoder.decode(chunk.value, { stream: true });
        if (text) await callbacks.output(text);
      }
    } catch (error) {
      if (!closed) callbacks.error(controller.signal.reason instanceof Error ? controller.signal.reason : error instanceof Error ? error : new Error("Core log stream failed"));
    } finally {
      clearTimeout(deadline);
      controller.signal.removeEventListener("abort", cancelReader);
      signal.removeEventListener("abort", close);
      await reader?.cancel().catch(() => undefined);
      reader?.releaseLock();
    }
  })();
  return { close, done };
}
