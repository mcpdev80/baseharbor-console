# Testing and validation

BaseHarbor Console separates repository-local quality checks from native Core integration evidence.

## Local/public quality gate

Run:

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

`npm test` executes the architecture-boundary regression. It fails if Console code attempts to bypass BaseHarbor Core through direct runtime sockets, subprocess orchestration, invented machine API paths or unapproved transport primitives.

The GitHub CI workflow runs the same architecture test, TypeScript, lint and production build.

## Native contract/browser qualification

Live Console support requires a real, pinned BaseHarbor Core/runtime environment and is not simulated by repository-local fixtures.

The integration tracker is:

- https://github.com/mcpdev80/baseharbor-console/issues/2

It records immutable Console/Core revisions and original successful/failed evidence for OIDC/session behavior, runtime projections, metrics, terminal and log streaming.

A green local/CI quality gate does not by itself mean that a Console workflow is live-supported. Release eligibility requires the corresponding pinned cross-repository evidence.
