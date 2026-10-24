import test from "node:test";
import assert from "node:assert/strict";
import { MessageChannel } from "node:worker_threads";
import { once } from "node:events";
import { deliverAuthorizationCallback } from "../src/lib/baseharbor/oidc-callback.ts";

function callbackWindow(search = "?code=one-time-code&state=bound-state&iss=https%3A%2F%2Fcore.example%2Fissuer") {
  const messages: Array<{ value: unknown; origin: string }> = [];
  const history: string[] = [];
  let closed = false;
  return { messages, history, get closed() { return closed; }, close() { closed = true; },
    location: { search, hash: "", pathname: "/auth/callback", protocol: "https:", origin: "https://core.example" },
    opener: { postMessage(value: unknown, origin: string) { messages.push({ value, origin }); } },
    historyAPI: { replaceState(_data: unknown, _unused: string, path: string) { history.push(path); } },
  };
}

test("queued callback survives a due opener close check and closes only after verified receipt", async () => {
  const channel = new MessageChannel();
  const popup = callbackWindow();
  const delivered = once(channel.port1, "message");
  const outgoing = { ...popup, history: popup.historyAPI,
    opener: { postMessage(value: unknown, origin: string) {
      assert.equal(origin, "https://core.example");
      assert.deepEqual(popup.history, ["/auth/callback"], "Authorization query must be scrubbed before handoff");
      channel.port2.postMessage(value);
    } },
  };
  try {
    deliverAuthorizationCallback(outgoing);
    // A due cancellation timer may observe closed before the independent
    // posted-message task runs. The production callback must leave it open.
    assert.equal(popup.closed, false, "Popup self-close can make opener reject the queued legitimate callback");
    const [response] = await delivered;
    assert.deepEqual(response, { kind: "baseharbor.oidc-callback", code: "one-time-code", state: "bound-state", issuer: "https://core.example/issuer", error: undefined });
    popup.close(); // Existing opener performs origin/source checks before this.
    assert.equal(popup.closed, true);
  } finally { channel.port1.close(); channel.port2.close(); }
});

test("callback keeps exact-origin handoff, strips query, and marks duplicate or credential-bearing responses invalid", () => {
  for (const search of ["?code=a&code=b&state=s", "?access_token=never-forward&state=s", "?id_token=never-forward&state=s"]) {
    const popup = callbackWindow(search);
    deliverAuthorizationCallback({ ...popup, history: popup.historyAPI });
    assert.equal(popup.messages.length, 1);
    assert.deepEqual(popup.history, ["/auth/callback"]);
    assert.equal((popup.messages[0].value as {error: string}).error, "invalid_response");
    assert.ok(!JSON.stringify(popup.messages).includes("never-forward"));
  }
  const insecure = callbackWindow();
  insecure.location.protocol = "http:";
  deliverAuthorizationCallback({ ...insecure, history: insecure.historyAPI });
  assert.equal(insecure.messages.length, 0);
});
