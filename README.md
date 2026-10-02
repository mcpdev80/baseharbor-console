# BaseHarbor Console

BaseHarbor Console is the complete visual operations surface for BaseHarbor.

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

This repository intentionally starts with the final Console architecture while the BaseHarbor HTTP/runtime contracts are being completed.

The UI currently uses contract-shaped preview data. It must not introduce temporary Docker-specific browser APIs or a second orchestration backend.

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

Set the future BaseHarbor API endpoint with:

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
