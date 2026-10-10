# Console contract readiness

BaseHarbor Console is intentionally split into:

1. **contract shape**
2. **UI projection**
3. **live Core binding**

This prevents the frontend from inventing a second control plane. Live support is claimed only for workflows that have immutable Core/Console evidence; fixture coverage and contract shape alone are not support evidence.

## Current readiness

| Contract | Core issue | Shape | UI | Live binding |
| --- | --- | --- | --- | --- |
| Protected HTTP machine API | #767 / #806 | ready | ready | **partial, qualified** — authenticated discovery/read, runtime details, logs and terminal are proven; complete application mutation workflows remain pending |
| Machine Operator Authorization | #770 / #806 | ready | ready | **partial, qualified** — real OIDC/session, viewer denial, logout/expiry/audience behavior proven; complete mutation/approval coverage remains pending |
| Runtime Explorer / ownership | #768 | ready | ready | **partial, qualified** — real runtime list/inspect/metrics/logs proven through Core |
| Target Access Provider | #769 / #807 | ready | ready | Core-only boundary preserved; full remote Connector lifecycle qualification remains pending |

The release integration tracker is [Console issue #2](https://github.com/mcpdev80/baseharbor-console/issues/2). It records the exact immutable Console/Core revisions, successful and failed native runs, and the remaining release blockers.

## Qualified live slices

Current public evidence includes native browser runs against real BaseHarbor Core/Keycloak/runtime state for:

- authenticated Core admission and OIDC/session behavior;
- runtime list and inspect;
- native runtime metrics;
- terminal open/input/output/resize/exit and authorization denial;
- live log read/follow/stop;
- physical stream shutdown and no lingering Docker log follower.

These slices do **not** imply complete Console release eligibility. Core setup from the Console, complete Application plan/apply/status/doctor/evidence/destroy workflows, production rotation coverage and final release-candidate pinning remain separately required.

## Already modeled

The Console contract layer represents:

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

The Console does **not** define:

- routes outside the canonical versioned Core HTTP contract
- Console-specific RBAC
- a second deployment/application database
- direct Docker/Podman/Kubernetes/OpenShift browser access
- direct Console -> Node Connector calls
- generic remote shell or generic runtime-command channels
- guessed log/terminal/event stream URLs
- temporary plaintext or insecure management endpoints

## Binding rule

Live mode consumes the protected BaseHarbor machine contract through the Console adapter boundary. Preview/fixture data remains explicitly separated for development and must never be used as a fallback when live Core access fails.

The UI must not change lifecycle semantics. CLI, JSON, MCP, HTTP and Console remain projections over the same BaseHarbor Core operations.


## Current transport qualification

The HTTP client pins one HTTPS Core origin, rejects foreign/credential-bearing
URLs and redirects, uses a memory-only bearer provider and requires an explicit
wire decoder. SSE uses that same authenticated transport, bounded UTF-8 records
and explicit cancellation; it does not assume cookie-based EventSource works.

Local transport/security/SSE contract tests are executable through
`npm run test:contracts`. They do not prove login, live UI workflows, terminal
or remote Docker/Podman acceptance. Connected index routes consume actual Core results; other routes remain explicit previews.

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

Source tests qualify this transport boundary only. Actual OIDC, execution/result/events, runtime details, terminal and logs are qualified by the native receipts below. Complete application/setup/rotation and remote workflows remain pending.

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
source-qualified transport foundation. Applications, Targets, Workspaces and
Runtime Explorer index routes use the live adapter after sign-in; other routes
remain explicit previews. The actual sign-in/read-session browser receipt is
recorded below. Complete application/setup/rotation workflows remain pending.

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
qualified, with actual issuer/browser sign-in and read-session qualification
recorded below. Remaining live product workflows and release-evidence verification
are required before full release gates can pass.

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
storage. Routes without live bindings remain visibly marked as preview.

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
qualification, extended by the actual sign-in/read-session browser receipt below.
Remaining browser workflows and remote application lifecycle qualification remain pending. No runtime evidence is produced by the synthetic
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


## Console installation topology (v0.4.23)

One Console session connects directly to one selected authoritative Core in the
same BaseHarbor installation and security boundary. The Console is optional;
BaseHarbor's Core remains the lifecycle, policy, identity and secret authority.
Deploy Console and protected Core HTTP behind one HTTPS origin. By default the
Console uses its own origin; `NEXT_PUBLIC_BASEHARBOR_API_URL`, when set, must name
that same origin without a path or query. Independent cross-origin Core
installations are rejected before starting authentication or reading a bearer.

Discovery and execution/event/log/terminal destinations remain bound to this
Core. Redirects and foreign discovered destinations cannot forward its bearer.
The configured OIDC issuer can have its own HTTPS authority; issuer discovery
and code exchange do not carry the Core bearer. Logout and expiry destroy the
memory-only session and close its streams. There is no central Console backend
or multi-Core authority, Dev-to-Prod forwarding or installation federation.
A future installation selector requires direct authentication to the newly
selected installation and must never reuse the previous installation's session.


## Actual sign-in/read-session evidence

Console code `6b535f09be96bdb957867d5d0683829bebd50cf0` passed
[actual Chromium run 37476629789](https://github.com/mcpdev80/baseharbor-console/actions/runs/37476629789)
against Core `bc50ab466ed846e6e1595b401d7c45516c021eba`, native Keycloak
26.8.0 and PostgreSQL 18. The actual Core actor, selected environment and empty
read model were checked through POST, SSE and final GET. Real bearer-only
admission, foreign installation Origin/port denial, viewer mutation/destruction
denial, token expiry, wrong audience, logout and absence of browser-persisted
bearers passed. Actual native response JSON is read and forwarded unchanged;
no source/unit fixture supplies the browser execution result.

The private browser receipt is retained as artifact `11420195068`; its archive
SHA-256 is `97d0e167743b3ca0a6865b90f35b6a5b18aa71bd06ae6378d6fa88323456727a`.
This extends source qualification for the sign-in/read-session slice only.
Terminal/runtime journeys, production rotation, remaining detail/wizard flows
and authenticated private-origin release-evidence verification remain pending.


Runtime Explorer now supports capability-advertised live inspect and native metrics reads for the exact selected provider, target, kind and resource ID. A context or resource change aborts observation and clears the prior result. Unknown or mismatched observations are rejected; missing metrics stay unavailable. Native reference links are never followed with Core credentials. Source checks and the production build pass. The expanded actual browser receipt below qualifies native inspect/metrics and selection reset.

## Expanded actual browser qualification

Console `9e8afba8786e6220af50b48fd326d6018eb3e8ea` passed
[Chromium run 37502764895](https://github.com/mcpdev80/baseharbor-console/actions/runs/37502764895)
against the pinned Core `1c8527fed22e40dbb06a9fce4e36d16ad273e696`, native
Keycloak and PostgreSQL. The actual native container list, exact resource inspect,
native metrics and selection reset passed. The secure Core wizard's machine-role
selection and explicit submission reached Core; the viewer actor was correctly
rejected by Core with 403. Logout removed setup controls and bearer material,
and the explicit preview/fresh-context/expiry/audience checks passed.

The wizard delegates SQL/PostgreSQL, Secrets/OpenBao and Identity/Keycloak setup
to the selected installation. Machine role changes defaults; application isolation
can add provider instances and resource use. No insecure setup option is offered.

This receipt qualifies these browser read/admission flows. It does not prove
successful provider bootstrap from the Console, terminal execution, production
rotation, every application wizard or full release eligibility. Authenticated
private-origin release verification and final exact consumer pins remain pending.


## Native terminal and logs qualification

Console `f391bb48ac8a51d2d28569ec493b2be656544263` passed
[run 37526991138](https://github.com/mcpdev80/baseharbor-console/actions/runs/37526991138)
against Core `50fa5da46b07b9a60387e8c99283f6fd1d8b6d51`. Source job
`112486392042` and actual Chromium/Core/Keycloak job `112486391716` succeed.
The receipt retains the existing OIDC/read/runtime-detail checks and proves
actual PTY input/output, observed shell readiness, resize/stty, exit 7,
foreign-actor denial, closed-session input rejection and no lingering shell.

Logs read the last 100 lines or follow one selected managed/platform container
through a discovered authenticated Core POST. Headers bind the stream to the
selected target and resource before output is rendered. Split UTF-8 is decoded
strictly; the view retains the latest 64K characters. Stop, logout, expiry and
selection changes cancel observation without replay. Native qualification reads
the actual snapshot, receives newly generated container output, stops follow,
observes both HTTPS transport legs closing and checks that Core's exact native
Docker log follower disappears while the container remains running.

Private browser artifact `11442304902` has archive digest
`sha256:bea1a397158625216f3db7d7a4bbdc6780e14fa41a5a5c1a0ce63f233863e52d`.
Its scope is actual OIDC/read/runtime-details/terminal/logs/logout, with
`terminal_runtime_evidence: true`, `logs_runtime_evidence: true`,
`production_rotation_evidence: false` and `release_eligible: false`.
Full Console-driven setup and application lifecycle, production rotation and
final authenticated consumer gate coverage remain required. Original failed
run `37525663970` retains its outcome; the replacement checks physical transport
and process cancellation independently of the browser's completion observation.

## First-application continuation candidate

The candidate now offers secure Core setup only after an explicit retryable
`capability_missing/core_required` result from apply. The setup target and
environment remain bound to that deployment. Continuation requires the same
selected context and authenticated actor plus Core's authoritative READY state
with all three mandatory capabilities. Current callback state is checked after
setup, so a withdrawn application confirmation cannot be bypassed by a stale
async closure. Focused contract tests and the production build pass.

The expanded native browser fixture uses production CLI authoring for a managed
SQL application, then exercises failed first apply, explicit setup, automatic
continuation, plan/status/doctor/repair and confirmed destroy through Core HTTP.
It uses rootless Docker and owns its Core cleanup. This candidate is not yet
native-qualified; the previous limited receipt retains its original scope.

## Managed rotation candidate

The connected `/security/rotate` view uses the advertised shared Core operation
and explicit installation approval; it cannot provide host recovery paths or
keys. Core validates selected recovery material before mutation and returns
only initialized/unsealed/manager-ready flags after verification. Unit/source
checks and the production build pass. Native qualification now requires the
real Core CA file to change and successful Application status/doctor after
rotation before producing a successful rotation receipt. This candidate remains
unqualified until that exact-source native run completes; previous receipts
retain `production_rotation_evidence:false` and `release_eligible:false`.
