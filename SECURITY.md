# Security Policy

BaseHarbor Console exposes security-sensitive BaseHarbor workflows such as credentials, certificates, runtime access, recovery, terminal sessions and destructive operations.

## Reporting a vulnerability

Do **not** open a public issue for a suspected security vulnerability.

Use GitHub's private vulnerability reporting / Security Advisory flow for this repository.

Useful information includes:

- affected Console version or commit;
- affected BaseHarbor Core version/commit when relevant;
- reproduction steps;
- expected and observed behavior;
- security impact;
- screenshots/logs with all secrets removed.

Never include passwords, tokens, private keys, recovery material or live credentials.

## Security boundaries

The Console must preserve these boundaries:

- no Console-local authorization model;
- no Console-local secret store;
- no direct runtime/provider/Node Connector control from the browser;
- no CLI subprocess orchestration;
- no hard-coded provisional machine endpoints;
- HTTPS/authenticated Core transport for live machine operations;
- terminal/exec only through an explicit authorized Core capability;
- secret material excluded from browser persistence by default;
- destructive operations remain SafetyClass/policy/confirmation/audit aware.

Security-sensitive behavior must fail closed. A missing Core capability or contract should disable the action rather than fall back to a weaker path.

## Supported versions

The Console is currently pre-v1. Security fixes are applied to the latest development/released line unless a specific issue requires a backport.
