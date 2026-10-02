# BaseHarbor Console UX & Design System

Status: **Normative**

This document defines the UX and UI rules for BaseHarbor Console. New Console UI MUST follow these rules unless an explicit architecture/design decision records an exception.

The Console is a professional developer/platform operations surface. It must not become a generic admin template, a card-wall dashboard, or a runtime-specific console clone.

## 1. Product design direction

BaseHarbor Console combines proven patterns rather than copying one product:

- PatternFly: enterprise workflow, vertical navigation, tables, wizards, destructive actions.
- Grafana Saga: information density, operations focus, observability, task-first design.
- GitHub Primer: clarity, navigation, tables, keyboard/accessibility discipline.
- Vercel Geist: visual restraint, typography, developer-tool feel.
- BaseHarbor brand: canonical colors, typography, iconography and product identity.

Portainer is not a design reference.

## 2. Core principles

### 2.1 Task first

Every page MUST optimize for the user's current task.

A resource detail page should answer, in order:

1. What is this?
2. Is it healthy/ready?
3. What is desired vs observed?
4. Where does it run?
5. What is it related to?
6. What can the operator safely do next?

Do not lead with decorative charts or unrelated KPIs.

### 2.2 Context first

Relevant context MUST remain visible without forcing the user to infer it.

Depending on the page, this includes:

- application
- environment
- target
- runtime
- actor/session
- deployment/execution identity

### 2.3 One control plane

Console is a projection of BaseHarbor Core.

```text
CLI / JSON / MCP / HTTP / Console
              ↓
       BaseHarbor Core
```

UI MUST NOT invent:

- separate deployment state
- Console-only RBAC
- Console-only lifecycle semantics
- direct runtime-provider control
- direct Target Access / Node Connector control
- secret truth outside BaseHarbor

### 2.4 Information-dense, visually calm

Prefer compact structured information.

Avoid:

- oversized cards for simple scalar values
- decorative KPI walls
- excessive whitespace
- strong color on every resource
- oversized rounded SaaS controls
- repeated status text where one clear status is enough

## 3. Page shell and navigation

Desktop is the primary operating environment.

Base layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Masthead / search / current context / activity / account    │
├──────────────────┬───────────────────────────────────────────┤
│ Primary nav      │ Page header                               │
│                  │ Breadcrumb / context / actions            │
│                  │                                           │
│                  │ Main content                              │
└──────────────────┴───────────────────────────────────────────┘
```

Primary navigation groups:

```text
OVERVIEW
  Overview

DEVELOP
  Applications
  Repositories
  Workspaces

OPERATE
  Targets
  Runtime
  Operations
  Providers

OBSERVE
  Observability
  Evidence

PROTECT
  Security
  Recovery

PLATFORM
  Organization
  Settings
```

Rules:

- primary navigation MUST remain consistent across pages;
- groups MUST be labeled;
- current location MUST be visible;
- expandable groups MUST support keyboard navigation;
- do not expose more hierarchy in the sidebar than is useful;
- deeper context belongs inside the page.

## 4. Page patterns

BaseHarbor uses a small set of repeatable page patterns.

### 4.1 List page

Used for:

- Applications
- Repositories
- Workspaces
- Targets
- Providers
- Runtime resources
- Images
- Volumes/PVCs
- Networks
- Operations
- Backups

Pattern:

```text
Title                                              Primary action
Description

Search / filters / scope controls

Table or structured list
```

Use a table when users compare multiple objects across common attributes.

Use cards only when visual content is itself important.

### 4.2 Detail page

Used for:

- Application
- Target
- Provider
- Runtime resource
- Operation
- Backup

Pattern:

```text
Breadcrumb / Back

Resource name                status / context          actions
secondary identity

Summary / key state

Tabs or page sections

Primary content
```

### 4.3 Operation page

Every mutating action MUST map to a BaseHarbor machine operation.

The UI MUST expose:

- operation id
- safety class
- actor
- resource
- target/environment where applicable
- policy requirement
- confirmation requirement
- execution id
- progress/result

### 4.4 Wizard

Complex creation/adoption workflows MUST use an in-page wizard.

Use for:

- app init/adoption
- target creation
- provider addition where multi-step
- restore flows where multiple dependent choices exist

Do not use a wizard for simple single-form input.

## 5. Application Init / Adoption wizard

Normative flow:

```text
1 Source
2 Application
3 Environment
4 Providers
5 Observability
6 Target
7 Review
```

Rules:

- one primary action per step;
- Back / Next / Cancel behavior is consistent;
- later steps may be disabled until prerequisites are satisfied;
- visited steps may be revisited;
- leaving with unsaved state MUST warn;
- final step MUST be Review;
- Review MUST show effective choices and planned changes;
- final actions should be Plan and, where allowed, Apply.

Example:

```text
Review

Application       demo
Environment       dev
Target            local

Runtime           docker

Providers
PostgreSQL        shared
Valkey            shared
S3                external

Observability
Metrics           enabled
Logs              enabled
Traces            enabled

Security
TLS               enabled
Secrets           OpenBao

Changes
+ application demo
+ PostgreSQL binding
+ exposure demo.baseharbor.localhost

[Back] [Plan] [Apply]
```

## 6. Tables

Tables are the default representation for operational resources that share comparable attributes.

Required capabilities where appropriate:

- search
- filtering
- sorting
- pagination or virtualized loading for large datasets
- row selection only when bulk action is meaningful
- overflow row menu for secondary actions
- visible empty state
- keyboard-accessible controls

Avoid placing many action buttons directly in every row.

Preferred:

```text
demo-api   container   managed   healthy   2.8%   176 MB   [...]
```

Not:

```text
demo-api [Start] [Stop] [Restart] [Logs] [Terminal] [Delete]
```

Primary creation action belongs above the table, usually on the right side of the filter/search toolbar.

## 7. Detail tabs

Tabs are only for sibling views of the same resource.

Aim for approximately 5-7 visible top-level tabs.

Application detail:

```text
Overview
Runtime
Providers
Observability
Operations
Evidence
```

Runtime resource detail:

```text
Overview
Logs
Metrics
Events
Inspect
Terminal
```

If more views are needed, consolidate or use local secondary navigation.

## 8. Runtime Explorer

Runtime Explorer is provider-neutral.

Default table:

```text
Target: All   Runtime: All   Ownership: All   Health: All
Search resources...

RESOURCE             TYPE        OWNER       STATE      CPU      MEMORY
demo-api             container   managed     healthy    2.8%     176 MB
shared-postgresql    container   platform    healthy    1.3%     276 MB
manual-nginx         container   unmanaged   unknown    0.1%      19 MB
```

Filters MUST remain visible and easy to reset.

Opening a row goes to the detail page.

Runtime-native data may appear as extension detail but MUST NOT replace BaseHarbor identity/ownership/context.

## 9. Application detail

Application detail MUST foreground application lifecycle, not runtime implementation.

Header example:

```text
demo                                         Healthy · Ready
dev / local · dep-demo-local

[Apply] [Repair] [Update] [Stop] [...]
```

The page should expose:

- desired / observed state
- readiness / health
- source / revision
- target
- runtime provider
- target access provider
- components
- capability providers
- related runtime resources
- recent operations
- observability summary
- recovery/evidence entry points

## 10. Runtime resource detail

Header example:

```text
demo-api                                     Healthy · Ready
container · managed · Docker / local

[Restart] [Stop] [Logs] [Terminal] [...]
```

The page should expose:

- BaseHarbor resource identity
- native identity as secondary information
- desired / observed state
- ownership
- image/runtime detail
- relationships
- metrics
- logs/events
- inspect data
- authorized terminal/exec capability

## 11. Actions and safety

Actions MUST respect BaseHarbor SafetyClass.

### read_only

- execute directly;
- no confirmation unless the operation has unusual impact.

### mutating

- may execute directly when reversible and low-risk;
- show operation state/progress;
- confirmation may be required by Core.

### destructive

- MUST visually distinguish consequence;
- MUST show affected resource/context;
- MUST explain what is deleted/irreversible;
- MUST honor Core confirmation requirements;
- high-risk irreversible actions may require typed confirmation.

Example:

```text
Destroy application?

Application     demo
Environment     prod
Target          prod-eu
Operation       application.destroy
Safety          destructive

This removes managed runtime resources owned by this deployment.
Persistent resources are handled according to the BaseHarbor destroy plan.

[Cancel] [Destroy application]
```

The Console MUST NOT invent different safety logic from Core.

## 12. Status and color

Status MUST never rely on color alone.

Always combine text and/or icon:

- ✓ Healthy
- ! Degraded
- × Failed
- ○ Unknown
- … Pending

Color roles:

### Signal Blue

- primary action
- active navigation
- selected state
- links
- focus indication

### Harbor Orange

- warning
- attention
- caution
- pending destructive confirmation

### Red

- failure
- critical state
- destructive action

### Green

- healthy
- ready
- success

Do not tint whole pages/resources according to status.

## 13. Overview

Overview is an attention and orientation surface, not a KPI dashboard.

Priority order:

1. items needing attention
2. application health summary
3. targets / connectivity
4. running operations
5. recent activity
6. selected compact totals only where useful

Preferred:

```text
Needs attention
platform-tools   test / lab   readiness failed
PostgreSQL       lab          credential rotation due

Applications
3 total · 2 running · 1 degraded

Targets
local   Docker / local                  Healthy
lab     Podman / Node Connector         Healthy

Running operations
application.apply   platform-tools      72%

Recent activity
20:44 Repair started
20:42 demo reached READY
```

Avoid decorative KPI-card walls.

## 14. Notifications and progress

Do not use toast spam.

A transient notification should communicate a meaningful event, for example:

```text
Operation started
application.apply · demo
View progress
```

Long-running progress belongs in Operations/Activity and in the relevant resource context.

Failures MUST offer actionable next information where BaseHarbor provides it.

## 15. Logs, metrics and terminal

### Logs

- stream within resource/application context;
- filtering/search where supported;
- follow/pause behavior;
- timestamps and source identity;
- no direct browser-to-runtime connection.

### Metrics

- use charts only when trends matter;
- always retain textual/numeric equivalents;
- avoid dashboard proliferation.

### Terminal

- explicit capability;
- clear resource identity;
- explicit actor/session;
- no generic host shell shortcut;
- session start is policy/authorization controlled;
- terminal must visibly indicate target/resource.

## 16. Responsive behavior

BaseHarbor is desktop-first but MUST degrade responsibly.

Desktop:
- full navigation
- full operational tables
- multi-column detail layouts

Tablet:
- reduced columns
- details via page/drawer
- collapsible navigation

Mobile:
- summary lists instead of forcing wide tables;
- resource details remain accessible;
- destructive/critical actions remain usable and clear.

Do not destroy desktop information density to optimize for very narrow screens.

## 17. Accessibility

Target: WCAG 2.2 AA.

Required:

- one semantic `main` landmark;
- skip-to-content;
- accessible labels for nav landmarks;
- visible keyboard focus;
- logical Tab / Shift+Tab order;
- Enter/Space support for interactive expandable navigation;
- semantic tables with headers;
- status not encoded by color alone;
- focus must not be obscured by sticky UI;
- modals return focus to the triggering element;
- modal background is non-interactive;
- accessible names for icon-only controls;
- reasonable minimum target size / spacing;
- charts provide an equivalent textual/table representation;
- scrollable dialog/wizard regions remain keyboard accessible.

## 18. Breadcrumbs and back navigation

Breadcrumbs represent information hierarchy, not browser history.

Examples:

```text
Applications / demo / Runtime / demo-api
```

Use an explicit Back action when the user arrived from another task/context and returning there is useful.

## 19. Modals

Use modals for:

- focused confirmation
- short secondary tasks
- concise destructive-action confirmation
- contextual information that should not become a page

Do not put complex multi-step workflows in ordinary modals.

Modal copy MUST be specific about context and consequences.

## 20. Empty, loading and error states

Every major resource list/detail MUST define:

- loading
- empty
- no-results/filter-empty
- unauthorized
- unavailable/offline
- failed
- degraded/partial data

Empty state must explain what can be done next.

Errors should surface BaseHarbor structured problem fields where available:

- code
- message
- next
- retryable
- resource
- remediation class

## 21. Copy and terminology

Use BaseHarbor contract terminology consistently.

Preferred:

- Application
- Deployment
- Component
- Provider
- Runtime Provider
- Target Access Provider
- Target
- Runtime Resource
- Operation
- Execution
- Evidence
- Desired State
- Observed State

Do not collapse Runtime Provider and Target Access Provider into "runtime" or "host connection."

## 22. Visual rules

Canonical BaseHarbor brand tokens are defined in `src/styles/brand-tokens.css`.

Visual direction:

- dark technical surface
- restrained borders
- compact spacing
- restrained radii
- Signal Blue for primary/selection
- Orange only for attention
- limited elevation/shadow
- subtle grouping instead of excessive panels
- typography carries hierarchy before color

## 23. Review checklist

Every new page/component must pass this checklist:

### Structure
- [ ] Is the user's primary task obvious?
- [ ] Is current application/environment/target context clear where relevant?
- [ ] Does the page use an existing page pattern?

### Data
- [ ] Is BaseHarbor authoritative state distinguished from runtime-native detail?
- [ ] Are Desired and Observed state distinguished where applicable?
- [ ] Is ownership visible where relevant?

### Actions
- [ ] Is every mutating action a BaseHarbor machine operation?
- [ ] Is SafetyClass respected?
- [ ] Are destructive consequences explicit?
- [ ] Are secondary actions moved out of dense table rows?

### Accessibility
- [ ] Keyboard usable?
- [ ] Visible focus?
- [ ] Status not color-only?
- [ ] Accessible labels?
- [ ] Correct semantic table/heading/main/nav structure?

### Visual
- [ ] No unnecessary card wall?
- [ ] Information density appropriate?
- [ ] Colors used semantically?
- [ ] BaseHarbor brand tokens used?

### Responsive
- [ ] Desktop layout optimized?
- [ ] Tablet/mobile fallback defined?
- [ ] Wide table has a narrow-screen strategy?

## 24. References

The rules above are informed by established design-system guidance including:

- PatternFly navigation, page, wizard and modal guidance;
- Grafana Saga design principles and operations-oriented patterns;
- GitHub Primer navigation/accessibility patterns;
- Vercel Geist tab/navigation conventions;
- WCAG 2.2 accessibility requirements.

These are references, not visual templates. BaseHarbor owns its product identity and information architecture.
