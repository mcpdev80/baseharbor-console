## What changed?

<!-- Keep this focused. Describe the user-visible behavior or architecture that changed. -->

## Why?

<!-- What problem does this solve? -->

## Verification

<!-- Targeted local/Hugging Face checks and final CI evidence used to verify the change. -->

## Console architecture / Core contracts

- [ ] No BaseHarbor Core contract impact.
- [ ] #767 HTTP/operations/streams are affected or consumed.
- [ ] #768 runtime-resource/ownership semantics are affected or consumed.
- [ ] #769 Runtime Provider / Target Access boundary is affected or consumed.
- [ ] #770 authorization/actor/SafetyClass behavior is affected or consumed.
- [ ] No direct browser-to-Docker/Podman/Kubernetes/OpenShift/Node Connector path was introduced.
- [ ] No Console-local deployment state, RBAC or secret store was introduced.

## UX / accessibility

- [ ] The change follows `docs/UX-DESIGN-SYSTEM.md`.
- [ ] Status does not rely on color alone.
- [ ] Keyboard/focus behavior was considered.
- [ ] Complex dependent mutation uses Review/Plan semantics rather than an oversized one-shot form.
- [ ] Pending Core capabilities are explicit; there are no clickable fake actions.

## Contributor checks

- [ ] `npm run check:architecture` passes.
- [ ] `npm run typecheck` passes.
- [ ] ESLint passes for the changed area.
- [ ] Relevant targeted tests/checks pass.
- [ ] Documentation was updated when behavior or contracts changed.
- [ ] No secrets, credentials, private keys or recovery material are included.
