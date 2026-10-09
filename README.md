# BaseHarbor Console

BaseHarbor Console is the visual operations surface for BaseHarbor.

The v0.4.23 integration branch includes a protected transport consumer for public
Core discovery, execution, events and typed errors. OAuth code/PKCE sign-in
and validated live index routes are implemented. The actual sign-in/read/runtime-details/terminal/logs
browser qualification passed; remaining application/setup/rotation workflows are tracked in Console #2. Immutable public Core schemas and synthetic examples are
pinned under `contracts/core-machine/v1/` and checked against their originals in
CI.

> One BaseHarbor truth: CLI, JSON, MCP, HTTP and Console use the same Core semantics.

## Architecture

```text
Console
  |
  v
Protected BaseHarbor HTTP / streams
  |
  v
BaseHarbor Core
  |
  +--> Runtime Provider
  |
  +--> Capability Provider
  |
  +--> Delivery Provider
  |
  +--> Target Access Provider
```

The Console does **not** talk directly to Docker, Podman, Kubernetes, OpenShift or the optional Node Connector.

## Product areas

- Overview
- Applications
- Repositories
- Workspaces
- Targets
- Runtime Explorer
- Providers
- Observability
- Recovery
- Security
- Evidence
- Organization / Platform
- Settings

## BaseHarbor dependencies

The pre-v0.5 Core work that enables the Console is tracked in BaseHarbor:

- #770 - Machine Operator Authorization
- #767 - protected HTTP machine API, long-running operations and streams
- #768 - provider-neutral Runtime Explorer / ownership model
- #769 - Target Access Provider boundary

## Current state

The Console UI foundation consumes the published Core machine contracts. Connected index routes and runtime observations are implemented; first-application Core setup and continuation are implemented; their expanded native browser qualification and rotation workflows remain in progress.

Implemented now:

- application, repository, workspace, target, provider and runtime views
- provider-neutral Runtime Explorer with ownership and health
- images, volumes, networks and semantic events
- observability, evidence, recovery, security and platform views
- guided workflows for app init/adoption, target create/edit, provider add/replace, restore, OpenBao recovery, credential/certificate rotation, migration and platform onboarding
- responsive desktop/mobile shell and responsive operational list fallbacks
- SafetyClass-aware destructive confirmation
- contract diagnostics and explicit fixture/live readiness
- architecture guard preventing accidental direct runtime access or provisional API-path lock-in

The preview adapter is explicit fixture data. Applications, Targets, Workspaces
and Runtime Explorer index routes select the live Core adapter after sign-in.
Other routes remain marked as preview. Core foundations #767–#770 are implemented;
remaining actual browser workflows are integration work in Console #2.

The Console must not introduce temporary Docker-specific browser APIs, hard-coded provisional BaseHarbor endpoints or a second orchestration backend.

## Brand

Branding is derived from the canonical BaseHarbor CI package in `baseharbor/docs/brand`.

Core tokens:

- Harbor Navy `#0B152A`
- Ocean Blue `#0068E9`
- Signal Blue `#0583FB`
- Harbor Orange `#F96509`
- Mist `#E3EAF1`
- Inter for UI
- JetBrains Mono for code

The BaseHarbor icon in `public/baseharbor-icon-128.png` is copied byte-for-byte from the canonical brand asset.

## Development

Requirements:

- Node.js 24.14+
- npm

```bash
npm install
npm run dev
```

When the protected BaseHarbor HTTP contract is available, configure its endpoint with:

```bash
NEXT_PUBLIC_BASEHARBOR_API_URL=https://localhost:8443
```

## Rules

- no Console-owned deployment state
- no duplicate policy/RBAC
- no duplicate secret store
- no CLI subprocess parsing
- no direct Docker/Podman/Kubernetes control from the browser
- runtime resources use provider-neutral BaseHarbor identities
- low-level runtime actions remain policy/ownership/reconciliation aware
- destructive actions use BaseHarbor safety and confirmation semantics


## UX / design system

The normative Console UX rules are defined in:

`docs/UX-DESIGN-SYSTEM.md`

All new UI should use the established BaseHarbor page patterns for lists, details, operations and in-page wizards. The design direction is a professional developer/platform operations console: dense, calm, task-first and accessible.


## Validation

Fast development validation is performed outside GitHub CI where possible.

Available local checks:

```bash
npm run check:architecture
npm run typecheck
npm run check
```

The architecture check rejects direct runtime sockets, Console subprocess orchestration, provisional `/api/v1` machine routes, direct fetches outside the BaseHarbor transport, and direct EventSource/WebSocket use outside the stream boundary.


## v0.4.23 live integration

Console #2 tracks the live Core adapter and pinned workflow qualification. Core
#767/#768/#769/#770 are delivered foundations; follow-up transport/authority
work is Core #806/#807/#808. Preview remains labeled and cannot become a fallback
for a failed live operation.

The transport uses explicit memory-only bearer authentication, a pinned HTTPS
origin and redirect rejection. Every response requires a wire decoder. SSE uses
the same bearer boundary and bounded records; no cookie-only authentication or
automatic process replay is assumed. Transport contract tests are available with
`npm run test:contracts`. Full live workflow qualification remains pending.

Authenticated index routes for Applications, Targets, Workspaces and Runtime
Explorer now select the validated live Core adapter. Application execution uses
one submission and correlated Core observation; live failures and expired
sessions never select preview data. Remaining routes retain explicit fixture
preview until their supported Core workflows are connected. Complete browser
application/setup/rotation and remote lifecycle qualification are still required before release.

The connected Runtime Explorer includes capability-bound xterm input/resize and
correlated output/exit over protected Core HTTP/SSE. Its source tests prove
bounds, correlation, cancellation and non-replay. Actual issuer/browser terminal and log qualification is recorded below; complete remote application qualification remains pending.


The targeted browser workflow runs the built Console in Chromium against the
actual public Core server, native PostgreSQL migrations and a real Keycloak
26.8 issuer. Its isolated test CA and synthetic viewer membership qualify the
code/S256 sign-in, authoritative HTTP/SSE/read-model path, logout and lack of
persisted Core bearer material. The latest retained private receipt qualifies actual terminal/log runtime but excludes
production CA rotation and complete pre-release approval.
The fixture scripts orchestrate test services only; product requests continue to
use the canonical advertised Core HTTP operations.


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


## Actual browser qualification — 2026-10-06

[Run 37476629789](https://github.com/mcpdev80/baseharbor-console/actions/runs/37476629789)
passed both source quality and the actual browser job for Console code commit
`6b535f09be96bdb957867d5d0683829bebd50cf0` against immutable Core
`bc50ab466ed846e6e1595b401d7c45516c021eba`. Native Keycloak 26.8.0 and
PostgreSQL 18 were used. The ten completed checks cover real code/S256 login,
authoritative Core POST/SSE/GET and empty read model, bearer-only admission,
installation Origin binding, viewer read permission and mutation/destruction
denial, no persisted bearer, logout/explicit preview, fresh-context isolation,
real token expiry and wrong-audience denial. The harness reads actual native
JSON responses before forwarding them unchanged to the browser.

The private browser receipt is retained as artifact `11420195068`, with archive
SHA-256 `97d0e167743b3ca0a6865b90f35b6a5b18aa71bd06ae6378d6fa88323456727a`.
Its scope is sign-in/read-session qualification. Actual terminal/runtime journeys,
production rotation, remaining detail/wizard workflows and authenticated private
release-evidence verification remain required; the receipt is not release approval.


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


## Native terminal and live logs

[Run 37526991138](https://github.com/mcpdev80/baseharbor-console/actions/runs/37526991138)
qualifies Console `f391bb48ac8a51d2d28569ec493b2be656544263` against Core
`50fa5da46b07b9a60387e8c99283f6fd1d8b6d51`: actual shell input/output, resize,
exit and foreign-actor denial, plus log snapshot/new follow output/stop.
Stopping closes both HTTPS legs and leaves no native log follower; it keeps the
container running. The view retains the latest 64K characters, and observation
is cancelled on selection changes, logout and expiry without reconnect/replay.
The [readiness record](docs/CONTRACT-READINESS.md) binds the private artifact and
its limited scope. Complete application/setup/rotation workflows and remote
application lifecycle remain required before pre-release approval.

## First application and secure Core setup

When Core explicitly rejects the selected apply because mandatory Core services
are absent, the Console offers setup for that exact environment and target.
The user confirms setup and selects development or deployment defaults. Only a
successful, authoritative READY result for PostgreSQL, OpenBao and Keycloak
allows the same selected apply to continue. Changing selection, ending the
session or withdrawing application approval prevents automatic continuation.
Interrupted or otherwise failed mutations are never automatically replayed.
Core capabilities are mandatory; provider placement may be shared or
application-isolated. Additional isolation can require additional resources.

## Managed Core trust rotation

The connected Security rotation page submits Core's advertised `openbao.rotate`
operation for one explicit installation target and environment after user
confirmation. Core selects protected recovery material, rotates its PostgreSQL
administration/OpenBao manager credentials and service CA, and verifies
replacement material before retirement. Browser input and results contain no
recovery keys or credentials. Only Core's succeeded execution and all readiness
flags report completion. Ended observation must be inspected before retrying.
The expanded native rotation journey is pending qualification.

## Complete private release-integration evidence

To qualify the exact current Core without changing this immutable consumer
source again, push `release-integration/v0.4.23/core/<40-character-Core-SHA>`
at the reviewed Console commit. The producer checks out that exact Core,
reads its exact Demo pin and still verifies all six locked contract files byte
for byte before the browser journey. Mutable refs and malformed candidate
branches are rejected. Historical integration branches retain the source-lock
Core pin. Source-only receipts remain ineligible for release approval.

The dedicated `.github/workflows/release-integration.yml` producer runs only on
explicit `release-integration/**` pushes. Its qualification job is
`Integration · integration/static/live-console`. It depends on source checks and
executes the actual browser journey, then requires successful owned cleanup.

The producer binds exact Console, public Core and reference Demo commits,
hashes the built Console and obtains its current job/attempt from authenticated
Actions metadata. It rejects old partial browser receipts, failed cleanup,
missing authoritative application readiness, incomplete setup/rotation and
foreign or moving source identities. Tokens and recovery material are excluded
from evidence output.

Only the complete Console qualification can emit the private integration receipt.
Public Core independently authenticates that private origin and artifact digest.
This does not approve the joint release: Connector qualification, remote
application lifecycle and all mandatory Core gates remain separate requirements.
The full native setup/application/rotation journey remains unqualified until it
actually passes; publishing this producer does not supply missing runtime proof.

## v0.4.24 integration candidate and acceptance boundary

Console candidate: `de4b6fd436d70b7d03d38069b1873e23305580ad` ([PR #4](https://github.com/mcpdev80/baseharbor-console/pull/4)).
Core candidate under active development: `49a2fab76079b98b5697ba9f556abb6e6c066cac` ([Core PR #837](https://github.com/mcpdev80/baseharbor/pull/837)).
Node Connector candidate: `bceafc43befc6f52f5da56c796519edeaafe80b4` ([Connector PR #5](https://github.com/mcpdev80/baseharbor-node-connector/pull/5)).

The Console package's `npm ci && npm run check` (51 tests including typecheck/lint) and `next build` passed on the cited Console commit ([HF evidence](https://huggingface.co/jobs/ThunderHawk1080/6ac7eb02095c5780892fc996)). These independent checks do not verify this Core/Connector SHA combination. Before publishing v0.4.24, perform protected live OIDC sign-in/logout, role-based read/write/destructive denials, application lifecycle, logs/terminal and remote Target journeys with this exact tuple or a subsequently synchronized immutable tuple. Failures must never silently fall back to fixture data.

This section is a candidate matrix, **not** a release pin or a claim of final integrated acceptance.

The v0.4.24 consumer contract is pinned to Core `2a3bed3fef777cf6f9190032690df364537eda12`. `integration-candidate.json` binds the exact Core and Demo source for joint qualification. The native Connector integration matrix exercises this Console source against the same Core, real OIDC and Docker/Podman remote application lifecycle. Results remain pending until recorded in Core PR #837.
