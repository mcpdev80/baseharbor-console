import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { beginAuthorization, MemoryBearer } from "../src/lib/baseharbor/oidc.ts";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const config = { issuer: "https://identity.example/realm", clientId: "console-public", consoleOrigin: "https://core.example" };
function metadata() { return { issuer: config.issuer, authorization_endpoint: "https://identity.example/authorize", token_endpoint: "https://identity.example/token", response_types_supported: ["code"], code_challenge_methods_supported: ["S256"], authorization_response_iss_parameter_supported: true }; }
function response(value: unknown) { return new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } }); }

test("public code flow binds S256, state, issuer and exact callback without credential persistence", async () => {
  let calls = 0, authorization: URL;
  globalThis.fetch = async (destination, init) => {
    calls++;
    assert.equal(init?.credentials, "omit"); assert.equal(init?.redirect, "error");
    assert.equal(new Headers(init?.headers).has("Authorization"), false);
    if (calls === 1) { assert.equal(String(destination), config.issuer + "/.well-known/openid-configuration"); return response(metadata()); }
    assert.equal(String(destination), metadata().token_endpoint); assert.equal(init?.method, "POST");
    const form = new URLSearchParams(String(init?.body)), verifier = form.get("code_verifier")!;
    assert.match(verifier, /^[A-Za-z0-9_-]{43}$/);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
    const challenge = btoa(String.fromCharCode(...digest)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
    assert.equal(challenge, authorization.searchParams.get("code_challenge"));
    assert.equal(form.get("redirect_uri"), "https://core.example/auth/callback");
    assert.equal(form.get("client_id"), config.clientId); assert.equal(form.get("grant_type"), "authorization_code");
    assert.equal(form.get("client_secret"), null);
    return response({ access_token: "opaque-access-token", id_token: "never-a-core-credential", refresh_token: "never-persisted", token_type: "Bearer", expires_in: 60 });
  };
  const flow = await beginAuthorization(config);
  authorization = new URL(flow.authorizationUrl);
  const state = authorization.searchParams.get("state")!;
  assert.equal(authorization.searchParams.get("response_type"), "code"); assert.equal(authorization.searchParams.get("code_challenge_method"), "S256");
  assert.equal(authorization.searchParams.get("scope"), null);
  await assert.rejects(() => flow.complete({ state: "wrong", code: "code", issuer: config.issuer }));
  await assert.rejects(() => flow.complete({ state, code: "code", issuer: "https://foreign.example" }));
  assert.equal(calls, 1);
  const bearer = await flow.complete({ state, code: "code", issuer: config.issuer });
  assert.equal(bearer.accessToken(), "opaque-access-token");
  assert.equal(bearer.expiresAt > Date.now(), true);
  await assert.rejects(() => flow.complete({ state, code: "code", issuer: config.issuer })); assert.equal(calls, 2);
  bearer.clear(); assert.equal(bearer.accessToken(), undefined);
});

test("foreign, plaintext, incompatible and unbound issuer metadata fails before code exchange", async () => {
  for (const change of [
    { issuer: "https://foreign.example" }, { authorization_endpoint: "http://identity.example/authorize" },
    { token_endpoint: "https://foreign.example/token" }, { token_endpoint: "https://identity.example/token?client_secret=x" },
    { code_challenge_methods_supported: ["plain"] }, { response_types_supported: ["token"] },
  ]) {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return response({ ...metadata(), ...change }); };
    await assert.rejects(() => beginAuthorization(config)); assert.equal(calls, 1);
  }
  let calls = 0;
  globalThis.fetch = async () => { calls++; return response(metadata()); };
  for (const issuer of ["http://identity.example", "https://user:password@identity.example", "https://identity.example?token=x"]) await assert.rejects(() => beginAuthorization({ ...config, issuer }));
  assert.equal(calls, 0);
});

test("ID-token-only, malformed bearer, expired and cancelled flows cannot grant a Core token", async () => {
  for (const token of [{ id_token: "id-only", token_type: "Bearer" }, { access_token: "bad token", token_type: "Bearer" }, { access_token: "opaque", token_type: "MAC" }, { access_token: "opaque", token_type: "Bearer", expires_in: 0 }]) {
    let calls = 0;
    globalThis.fetch = async () => response(calls++ === 0 ? metadata() : token);
    const flow = await beginAuthorization(config), state = new URL(flow.authorizationUrl).searchParams.get("state")!;
    await assert.rejects(() => flow.complete({ state, code: "code", issuer: config.issuer }));
    await assert.rejects(() => flow.complete({ state, code: "code", issuer: config.issuer }));
    assert.equal(calls, 2);
  }
  globalThis.fetch = async () => response(metadata());
  const flow = await beginAuthorization(config), state = new URL(flow.authorizationUrl).searchParams.get("state")!;
  flow.close(); await assert.rejects(() => flow.complete({ state, code: "code", issuer: config.issuer }));
  assert.equal(new MemoryBearer("expired", Date.now() - 1).accessToken(), undefined);
});
