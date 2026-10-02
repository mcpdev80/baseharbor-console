export interface StreamHandle {
  close(): void;
}

export function openEventStream(
  path: string,
  onMessage: (event: MessageEvent<string>) => void,
  onError?: (event: Event) => void,
): StreamHandle {
  const baseUrl = process.env.NEXT_PUBLIC_BASEHARBOR_API_URL ?? "";
  const source = new EventSource(`${baseUrl}${path}`, { withCredentials: true });

  source.onmessage = onMessage;
  source.onerror = (event) => onError?.(event);

  return {
    close() {
      source.close();
    },
  };
}

export function runtimeEventPath(target?: string): string {
  return target
    ? `/api/v1/events/runtime?target=${encodeURIComponent(target)}`
    : "/api/v1/events/runtime";
}

export function logStreamPath(resourceId: string): string {
  return `/api/v1/runtime/resources/${encodeURIComponent(resourceId)}/logs/stream`;
}

export function terminalSessionPath(resourceId: string): string {
  return `/api/v1/runtime/resources/${encodeURIComponent(resourceId)}/exec`;
}
