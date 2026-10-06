import { BaseHarborHttpTransport, baseHarborHttpTransport } from "./client.ts";

export interface StreamHandle {
  close(): void;
  readonly done: Promise<void>;
}

export interface DiscoveredStream {
  href: string;
  protocol: "sse";
}

const maxEventCharacters = 64 * 1024;

// SSE uses the same pinned bearer transport as operations. No cookies,
// automatic reconnect or assumed resumption of an interactive process.
export function openDiscoveredEventStream(
  stream: DiscoveredStream,
  onMessage: (event: MessageEvent<string>) => void,
  onError: (error: Error) => void,
  transport: BaseHarborHttpTransport = baseHarborHttpTransport,
): StreamHandle {
  if (stream.protocol !== "sse") throw new Error("Unsupported Core stream protocol");
  const controller = new AbortController();
  const done = (async () => {
    try {
      const response = await transport.open({
        href: stream.href,
        headers: { Accept: "text/event-stream" },
        signal: controller.signal,
      });
      if (!response.headers.get("Content-Type")?.toLowerCase().startsWith("text/event-stream") || !response.body) {
        await response.body?.cancel();
        throw new Error("Core did not return an authenticated event stream");
      }
      await readEventStream(response.body, (data, kind, id) => {
        onMessage(new MessageEvent(kind || "message", { data, lastEventId: id }));
      }, controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) onError(error instanceof Error ? error : new Error("Core stream failed"));
    }
  })();
  return { close: () => controller.abort(), done };
}

export async function readEventStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (data: string, kind: string, id: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let buffer = "", data = "", kind = "", id = "";
  const abort = () => { void reader.cancel(); };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    while (!signal?.aborted) {
      const chunk = await reader.read();
      if (chunk.done) {
        buffer += decoder.decode();
        if (buffer || data) throw new Error("Core stream ended with an incomplete event");
        return;
      }
      buffer += decoder.decode(chunk.value, { stream: true });
      let boundary: number;
      while ((boundary = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, boundary).replace(/\r$/, "");
        buffer = buffer.slice(boundary + 1);
        if (line.length + data.length > maxEventCharacters) throw new Error("Core event exceeds the bounded stream limit");
        if (!line) {
          if (data) onEvent(data.slice(0, -1), kind, id);
          data = ""; kind = "";
          continue;
        }
        if (line.startsWith(":")) continue;
        const colon = line.indexOf(":");
        const field = colon < 0 ? line : line.slice(0, colon);
        let value = colon < 0 ? "" : line.slice(colon + 1);
        if (value.startsWith(" ")) value = value.slice(1);
        if (field === "data") data += value + "\n";
        else if (field === "event") kind = value;
        else if (field === "id" && !value.includes("\0")) id = value;
      }
      if (buffer.length + data.length > maxEventCharacters) throw new Error("Core event exceeds the bounded stream limit");
    }
  } finally {
    signal?.removeEventListener("abort", abort);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
