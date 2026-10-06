# Console contract readiness

BaseHarbor Console is intentionally split into:

1. **contract shape**
2. **UI projection**
3. **live Core binding**

This prevents the frontend from inventing a second control plane while delivered Core contracts are being wired and independently qualified.

## Current readiness

| Contract | Core issue | Shape | UI | Live binding |
| --- | --- | --- | --- | --- |
| Protected HTTP machine API | #767 | ready | ready | pending |
| Machine Operator Authorization | #770 | ready | ready | pending |
| Runtime Explorer / ownership | #768 | ready | ready | pending |
| Target Access Provider | #769 | ready | ready | pending |

## Already modeled

The Console contract layer already represents:

- machine operations and SafetyClass
- confirmation/policy metadata
- stable execution identity and execution state
- structured progress
- structured problems
- effective actor/principal
- operation context
- authorization allow/deny decisions
- policy provenance
- provider-neutral runtime resources
- managed/external/unmanaged/platform ownership
- runtime relationships
- runtime capabilities
- Target Runtime Provider
- Target Access Provider
- Target Access security/trust metadata
- Target Access capabilities
- discovered transport links
- semantic machine events

## Explicitly not invented

Core #767/#768/#769/#770 are delivered foundations. The remaining live work is Console #2 and Core #806/#807/#808. The Console does **not** define:

- routes outside the canonical versioned Core HTTP contract
- Console-specific RBAC
- a second deployment/application database
- direct Docker/Podman/Kubernetes/OpenShift browser access
- direct Console -> Node Connector calls
- generic remote shell or generic runtime-command channels
- guessed log/terminal/event stream URLs
- temporary plaintext or insecure management endpoints

## Binding rule

When live binding lands, the fixture adapter is replaced by an adapter over the protected BaseHarbor machine contract.

The UI must not change lifecycle semantics. CLI, JSON, MCP, HTTP and Console remain projections over the same BaseHarbor Core operations.


## Current transport qualification

The HTTP client pins one HTTPS Core origin, rejects foreign/credential-bearing
URLs and redirects, uses a memory-only bearer provider and requires an explicit
wire decoder. SSE uses that same authenticated transport, bounded UTF-8 records
and explicit cancellation; it does not assume cookie-based EventSource works.

Local transport/security/SSE contract tests are executable through
`npm run test:contracts`. They do not prove login, live UI workflows, terminal
or remote Docker/Podman acceptance. The data adapter remains explicitly preview
until those real integrations are implemented and qualified.

## Authenticated discovery foundation

`discovery.ts` consumes the snake-case machine discovery contract delivered by
public Core `a9a44d918155dd4dbeabd95fd07272e4861946e5`. Only the documented
discovery bootstrap is fixed. Execution and stream endpoints come from the
authenticated `http` bindings installed and returned by the same Core registry.
The architecture check rejects additional fixed API routes.

The decoder checks machine/execution versions, unique semantic operation IDs,
safety and confirmation/policy flags, HTTP methods/protocols and known resource
placeholders. Endpoint URLs stay on the configured HTTPS Core origin. Validated
descriptors are immutable; execution/stream IDs cannot inject paths or query
credentials. Incompatible or incomplete discovery fails without a fixture or
alternate-route fallback.

Source tests qualify this transport boundary only. Existing UI pages still use
the fixture adapter. OIDC login, execution/result/event projection, terminal UI,
ownership actions and actual authenticated browser workflows remain pending.

## Canonical execution and event consumer

`machine-wire.ts` validates the public Core control envelopes without camel-case
UI aliases. `machine-session.ts` executes only advertised operations through
discovered bindings, checks returned operation/context/resource identities and
correlates ordered authenticated SSE events. Unsupported versions, unknown fields,
missing typed errors, foreign execution IDs and malformed streams fail explicitly;
there is no automatic execution or interactive-process replay.

The public schema and Core-generated synthetic examples are copied byte-for-byte
in `contracts/core-machine/v1/`, pinned by an immutable Core commit and SHA-256
digests. CI compares them with the original public checkout. Source tests consume
all Core examples and exercise negative correlation/selection cases. This is a
source-qualified transport foundation: the product pages still use the fixture
adapter, and OIDC login, live page workflows and browser/terminal qualification
remain pending.

## Operator sign-in implementation

The account control starts an authorization-code flow with S256 PKCE against one
configured HTTPS issuer. Issuer metadata and token exchange remain pinned to
that issuer authority, use no Core bearer, cookies or redirect following, and
are bounded. The one-time callback is bound to the exact popup source, Console
origin, random state and advertised response issuer. Callback parameters are
removed from browser history; ID tokens and refresh tokens are never used for
Core access or persisted.

An opaque access token remains in memory and is accepted for the Console session
only after authenticated Core discovery succeeds. Core validates its identity
and permissions. Logout or bounded session expiry clears the credential, closes
observation streams and prevents further transport use. This code is source
qualified; actual issuer/browser journeys and live product adapters are still
required before a release gate can pass.

Deployment configuration uses `NEXT_PUBLIC_BASEHARBOR_OIDC_ISSUER` and
`NEXT_PUBLIC_BASEHARBOR_OIDC_CLIENT_ID`. Register a public client with code flow,
S256 required, direct/password grants disabled, exact HTTPS
`<Console origin>/auth/callback`, and the Console origin permitted for token CORS.
The public client must issue access tokens for an audience accepted by the
existing Core management API (`BASEHARBOR_API_OIDC_AUDIENCES`). Serve Console and
protected Core endpoints under one HTTPS origin;
`NEXT_PUBLIC_BASEHARBOR_API_URL` defaults to that origin. No client secret is
built into the browser. The callback response uses no-referrer and no-store;
reverse-proxy access logs must omit callback query parameters.

The implementation requires issuer discovery to advertise S256 and uses issuer
authority-pinned authorization/token endpoints. Providers with split endpoint
authorities require an explicit supported trust topology before use. Configure
these deployment inputs before building the Next.js browser bundle. No
credential, role, permission or deployment state is stored in local/session
storage. The product remains visibly preview until its live pages are wired.

This is an OAuth 2.0 API client using OIDC provider discovery. The client uses
the server-configured default API scopes and requests an access token for Core;
Core authenticates the operator. Register a distinct browser client ID and Core
API audience. Configure the API audience in access tokens and in the existing
Core verifier's accepted audiences. Browser identity is rendered from verified
Core execution records.

## Live navigation and application execution

The Applications, Targets, Workspaces and Runtime Explorer index routes now
select a live Core adapter after sign-in. Select an environment and, for Runtime
Explorer, an explicit target, then read Core. The result decoder consumes public
Core-generated navigation/Runtime Explorer examples and rejects invented UI
fields, invalid ownership relationships and foreign target resources. Missing
observations remain unavailable; configured target metadata never invents health.

The Applications route submits advertised plan/status/doctor/apply/repair/destroy
operations for one selected Core deployment. Core still authorizes and executes
its shared semantics; destructive removal requires explicit approval. A request
is submitted once, its execution SSE is observed, and only the correlated final
Core record supplies the result. A transport/observation failure never replays a
mutation. Refresh/check the displayed execution identity before retrying.

Expired or ended live sessions do not switch these routes to fixture data. A
separate explicit preview action is required. Other routes remain visibly
fixture preview, including unsupported wizards/detail screens. This is source
qualification; actual issuer/browser workflows and remote application lifecycle
qualification remain pending. No runtime evidence is produced by the synthetic
examples or unit tests.

## Capability-bound terminal implementation

Runtime Explorer can open an xterm terminal for one selected owned container.
Before opening, the Console executes Core runtime capability discovery and
checks the exact target/provider and live `container.terminal` capability. Core
then verifies current actor, policy, ownership and argv again. The UI never
opens a direct Connector/runtime connection. Container program and arguments
are explicit; input is disabled until the authenticated stream is ready.

The transport validates Core-generated stream descriptors/events and the
canonical terminal schemas. Binary output uses bounded base64 frames, exact
stream identity and contiguous event/input sequences. Input/resize requests
serialize without retry, with at most 16 pending frames and 64 KiB of input.
Each input/renderer wait is bounded to five seconds; creation is bounded to
15 seconds. Output decoding awaits renderer acknowledgement. Disconnect,
logout, unmount, foreign/replayed frames and ambiguous input close the session;
no command or input is automatically replayed. The UI displays an exit only
when Core supplies a validated exit event. Source tests are not actual browser,
real issuer, PTY runtime or release qualification.
