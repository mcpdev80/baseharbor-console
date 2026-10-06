import fs from "node:fs";
import path from "node:path";

const root = process.env.BASEHARBOR_BROWSER_FIXTURE;
if (!root || !path.isAbsolute(root)) throw Error("An isolated absolute fixture directory is required");
fs.mkdirSync(path.join(root, "realm"), { recursive: true, mode: 0o755 });
const origin = "https://localhost:8443";
const realm = {
  realm: "baseharbor-browser", enabled: true, sslRequired: "none",
  accessTokenLifespan: 60, registrationAllowed: false, resetPasswordAllowed: false,
  clients: [{ clientId: "baseharbor-console-browser", enabled: true, protocol: "openid-connect",
    publicClient: true, standardFlowEnabled: true, implicitFlowEnabled: false,
    directAccessGrantsEnabled: false, serviceAccountsEnabled: false,
    redirectUris: [origin + "/auth/callback"], webOrigins: [origin],
    attributes: { "pkce.code.challenge.method": "S256" },
    defaultClientScopes: ["basic", "baseharbor-api-audience"] }],
  clientScopes: [{ name: "baseharbor-api-audience", protocol: "openid-connect",
    protocolMappers: [{ name: "Core API audience", protocol: "openid-connect", protocolMapper: "oidc-audience-mapper",
      config: { "included.custom.audience": "baseharbor-api", "access.token.claim": "true", "id.token.claim": "false" } }] }],
  users: [{ id: "22222222-2222-4222-8222-222222222222", username: "browser-owner", enabled: true,
    email: "browser-owner@example.invalid", emailVerified: true, firstName: "Browser", lastName: "Fixture",
    credentials: [{ type: "password", value: "isolated-browser-test-password", temporary: false }] }]
};
realm.clientScopes.push({ name: "basic", protocol: "openid-connect", attributes: { "include.in.token.scope": "false" },
  protocolMappers: [{ name: "sub", protocol: "openid-connect", protocolMapper: "oidc-sub-mapper", consentRequired: false,
    config: { "access.token.claim": "true", "introspection.token.claim": "true" } }] });
realm.clients.push({ ...realm.clients[0], clientId: "baseharbor-console-wrong-audience", defaultClientScopes: ["basic"] });
fs.writeFileSync(path.join(root, "realm", "baseharbor-browser-realm.json"), JSON.stringify(realm), { mode: 0o644 });
