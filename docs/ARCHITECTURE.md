# Console architecture

## One control plane

```text
CLI ----------+
JSON ---------|
MCP ----------+--> BaseHarbor Core
HTTP ---------|
Console ------+
```

The Console is a presentation and operations surface, not a second BaseHarbor implementation.

## Authorization

The Console uses the shared Machine Operator Authorization boundary from BaseHarbor #770.

```text
operator principal
+ operation
+ safety class
+ target/application/environment
+ policy
  |
  v
allow / deny
```

HTTP/Console-specific RBAC is forbidden.

## Runtime Explorer

The browser sees provider-neutral runtime resources from #768.

```text
Application
  -> Deployment
    -> Component / Provider
      -> Runtime realization
        -> RuntimeResource
```

Runtime-specific detail may be attached as extensions, but container names, Pod UIDs or similar native identifiers do not replace BaseHarbor identity.

Ownership classes:

- managed
- external
- unmanaged
- platform

## Target access

Runtime Provider and Target Access Provider are independent.

```text
runtime=docker      access=local
runtime=docker      access=node-connector
runtime=kubernetes  access=native-api
runtime=openshift   access=native-api
```

The Console never invokes Target Access Providers directly.

## Streams

Logs, events, progress and terminal/exec are created through the protected BaseHarbor API defined by #767.

A terminal session is an explicit bounded runtime capability, never a generic host-shell shortcut.

## Technology

The prototype's useful frontend choices are retained:

- Next.js / React / TypeScript
- Tailwind CSS
- Radix primitives where useful
- Lucide icons
- Monaco for BaseHarbor-related source/config views
- xterm for authorized terminal sessions
- Recharts for operational metrics

The prototype backend architecture, direct Docker/Podman orchestration, local auth database and old Agent model are intentionally not carried forward.


## UX and product design

`docs/UX-DESIGN-SYSTEM.md` is normative for Console UI implementation.

Every new or changed Console page must follow its page-pattern, navigation, table, operation/safety, wizard, accessibility and visual rules.

The Console must remain:

- task-first;
- context-first;
- information-dense but visually calm;
- desktop-first with responsible responsive fallback;
- WCAG 2.2 AA targeted;
- based on BaseHarbor contract terminology and authoritative Core state.

Portainer is explicitly not a design reference.
