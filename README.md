# BaseHarbor Console

BaseHarbor Console is the visual operations surface for BaseHarbor.

The v0.4.23 integration branch includes a protected transport consumer for public
Core discovery, execution, events and typed errors. Product pages currently use
preview data; OIDC login, live workflows and actual browser qualification are
tracked in Console #2. Immutable public Core schemas and synthetic examples are
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

The Console UI foundation is implemented against the final BaseHarbor architecture while the protected Core machine contracts are being finalized.

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

The current data adapter is intentionally fixture-backed. Live HTTP, authorization, stream and operation execution binding waits for BaseHarbor #767/#768/#769/#770.

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
