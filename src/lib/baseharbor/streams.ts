export interface StreamHandle {
  close(): void;
}

export interface DiscoveredStream {
  // Absolute or Core-relative URL supplied by BaseHarbor operation/capability discovery.
  href: string;
  protocol: "sse";
}

// Open a stream only from a URL returned by the finalized BaseHarbor machine contract.
// No runtime/log/terminal endpoint paths are constructed in the Console.
export function openDiscoveredEventStream(
  stream: DiscoveredStream,
  onMessage: (event: MessageEvent<string>) => void,
  onError?: (event: Event) => void,
): StreamHandle {
  if (typeof window === "undefined") {
    throw new Error("BaseHarbor event streams are browser-only");
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASEHARBOR_API_URL ?? window.location.origin;
  const href = new URL(stream.href, baseUrl).toString();
  const source = new EventSource(href, { withCredentials: true });

  source.onmessage = onMessage;
  source.onerror = (event) => onError?.(event);

  return {
    close() {
      source.close();
    },
  };
}

// Terminal transport is intentionally not implemented until #767 fixes the
// authenticated bidirectional session contract. In particular, the Console
// does not guess WebSocket paths and never falls back to a generic host shell.
