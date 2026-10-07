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

- hard-coded `/api/v1/...` route layout
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
