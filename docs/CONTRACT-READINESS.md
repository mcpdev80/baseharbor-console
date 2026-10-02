# Console contract readiness

BaseHarbor Console is intentionally split into:

1. **contract shape**
2. **UI projection**
3. **live Core binding**

This prevents the frontend from inventing a second control plane while BaseHarbor Core contracts are still being finalized.

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

Until the matching Core issue is implemented, the Console does **not** define:

- hard-coded `/api/v1/...` route layout
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
