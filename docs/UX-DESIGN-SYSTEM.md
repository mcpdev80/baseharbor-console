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


### 2.5 No fake controls

The Console MUST NOT present a control as executable when the required BaseHarbor Core contract is not bound.

Rules:

- an unavailable mutation is disabled and explains the blocking Core contract;
- destructive confirmation may be previewed, but the final mutation button MUST remain disabled without a real operation handler;
- preview-only workflow transitions MUST be labeled `Preview …`, not `Apply`, `Restore`, `Rotate` or equivalent;
- notifications/account/session controls remain disabled until their live contract exists;
- ordinary navigation/search that can work locally should be functional rather than disabled.

The user must always be able to distinguish:

```text
UI preview
contract-pending action
live Core-backed action
```

### 2.6 Fixture / preview mode is explicit

Contract-shaped fixture data is permitted only for building and validating the final UI shape.

When fixtures are active:

- the shell MUST visibly indicate preview/fixture mode;
- fixture data MUST remain behind the Console adapter;
- the Console MUST NOT imply that observed runtime/application state is live;
- fixture mode MUST NOT add a second backend, state store or authorization model;
- switching to live data means replacing the adapter binding, not rewriting UI lifecycle semantics.

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

## 5A. Wizard system — all complex BaseHarbor workflows

This section is normative for **all** BaseHarbor Console wizards, not only Application Init.

Use the same interaction model for:

- Application Init / Adoption
- Target Create / Edit
- Provider Add / Replace / External binding
- Backup Restore
- Credential / password rotation
- CA / client certificate rotation
- OpenBao recovery / recovery material setup where interactive
- Runtime migration / replacement where multiple dependent choices exist
- Organization / platform onboarding where staged choices are required

### Wizard UX goals

A BaseHarbor wizard MUST:

- reduce cognitive load by asking only what is needed at the current step;
- preserve user context and previous choices;
- explain implications before asking for irreversible choices;
- validate early, locally and in context;
- never force users to restart after a recoverable error;
- make defaults visible and explain inherited/effective values;
- support review before mutation;
- make the resulting BaseHarbor plan understandable;
- make it obvious what will happen when the user continues.

### Progress and step navigation

- show the current step, completed steps and remaining steps;
- step labels MUST describe user goals, not implementation details;
- completed steps may be revisited when doing so does not invalidate the workflow;
- when a previous change invalidates later choices, mark affected steps as needing review instead of silently resetting them;
- do not use percent-complete indicators when the number of meaningful steps is already visible;
- do not show fake progress.

Preferred:

```text
Source ✓
Application ✓
Environment ✓
Providers ●
Observability
Target
Review
```

### One decision cluster per step

Each step should contain one coherent group of related decisions.

Avoid large pages containing unrelated sections merely to reduce the number of steps.

A wizard step may contain several fields when they belong to the same decision, for example PostgreSQL placement, scope and HA mode.

### Smart defaults and provenance

Defaults are helpful only when the user can understand where they came from.

Show provenance where material:

```text
Target             local
                   Inherited from workspace default

PostgreSQL scope   shared
                   Recommended by application inspection

TLS                enabled
                   Required by prod policy
```

Distinguish:

- detected
- inherited
- recommended
- required by policy
- user-selected

The Console MUST NOT silently convert a recommendation into a requirement.

### Progressive disclosure

Show common choices first.

Advanced/runtime-specific options belong under clearly labeled advanced sections unless they materially affect the primary decision.

Do not expose every provider-native switch simply because the backend supports it.

### Validation

Validation should happen as close to the field/decision as possible.

Use three levels:

1. **Immediate field validation** for syntax/type errors.
2. **Step validation** for cross-field consistency.
3. **Preflight validation** before Review/Plan for external/core-dependent checks.

Do not wait until Apply to reveal predictable configuration errors.

Error messages MUST:

- identify the problem;
- identify the affected field/resource;
- explain what the user can do next;
- preserve entered data.

### Async validation and discovery

For runtime/provider/target discovery:

- show a meaningful pending state;
- allow unrelated fields to remain usable where safe;
- preserve results while moving between steps;
- expose retry when discovery fails;
- distinguish unavailable from unauthorized;
- do not use indefinite spinners without explanation.

Example:

```text
Checking target lab-node-01…
✓ Podman 5.x reachable
✓ Quadlet available
! Metrics capability unavailable

[Retry]
```

### Draft state, resume and abandonment

Longer workflows SHOULD support resumable draft state when BaseHarbor Core provides an appropriate draft/plan identity.

Rules:

- user input MUST survive normal Back/Next navigation;
- refreshing or accidental navigation should not silently destroy substantial work;
- leaving with meaningful unsaved changes MUST warn;
- if resumable drafts are supported, clearly show draft identity and last saved time;
- never store secret values in browser persistence merely to implement resume.

### Back, Cancel and Close

- Back returns to the previous decision without discarding valid input.
- Cancel exits the workflow without mutation.
- Close behaves like Cancel and warns when meaningful unsaved state exists.
- final mutation MUST never be triggered by Cancel/Close semantics.

### Review is mandatory before mutation

Complex mutating wizards MUST have a final Review step.

Review should show **effective state**, not merely echo form inputs.

Include where relevant:

- application/environment/target
- Runtime Provider
- Target Access Provider
- provider placement/scope
- HA/availability choice
- exposure/routes
- security/TLS
- credentials/trust action
- observability
- resources to create/update/remove
- warnings and policy constraints
- destructive consequences

### Plan / Diff before Apply

Where BaseHarbor supports planning, Review SHOULD show a semantic plan/diff.

Preferred:

```text
Planned changes

+ create application demo
+ bind shared PostgreSQL
~ rotate application database credential
+ create route demo.baseharbor.localhost
- remove obsolete Valkey binding
```

Do not show raw JSON/YAML as the primary review experience. A raw/technical view may be available secondarily.

### Safety and confirmations inside wizards

SafetyClass rules still apply.

- read-only wizard completion may finish without confirmation;
- mutating completion proceeds through the BaseHarbor operation model;
- destructive completion requires consequence-aware confirmation;
- typed confirmation is reserved for high-risk irreversible actions, not routine mutation.

Do not add confirmation dialogs after every wizard; Review itself is the primary deliberate decision point.

### Policy and locked values

When policy forces a value:

- show the value;
- explain that it is policy-controlled;
- show provenance/policy source when available;
- disable editing without making the control look broken.

Example:

```text
TLS  Enabled   🔒 Required by prod security policy
```

### Dependencies between choices

If one choice changes available later choices, update the wizard immediately and explain why.

Example:

```text
Environment changed to prod.

The following settings require review:
! Target
! TLS
! Provider availability
```

Never silently carry forward an incompatible value.

### Provider selection

Provider selection must be task-oriented.

Do not present a flat wall of provider logos.

Group by capability:

```text
Database
  PostgreSQL

Cache
  Valkey

Object storage
  SeaweedFS / S3 external

Secrets
  OpenBao / external
```

For each option show only decision-relevant information:

- scope: shared / app-scoped / external;
- availability/HA support where applicable;
- target compatibility;
- managed/external status;
- policy restrictions;
- health/readiness if selecting an existing resource.

### HA/availability UX

Where a provider supports HA, the wizard must make the availability decision understandable.

Do not expose only a replica-count field.

Show the semantic mode first:

```text
Availability

○ Single instance
● High availability

High availability
3 replicas across eligible placement domains
Automatic failover supported
```

Advanced topology details may be expanded separately.

### Credential and certificate rotation wizards

Rotation flows MUST make old/new state and cutover clear.

Typical flow:

```text
1 Scope
2 New credential / certificate
3 Dependents
4 Cutover strategy
5 Review
6 Rotate
7 Verify
```

Review MUST identify:

- affected applications/providers/clients;
- old material that will remain valid temporarily, if any;
- cutover/reload implications;
- revocation/removal timing;
- rollback/recovery implications.

Never display reusable secrets again after creation unless BaseHarbor explicitly supports a secure reveal operation.

### Restore wizard

Restore flows require stronger preflight than normal create flows.

Typical flow:

```text
1 Backup
2 Destination
3 Restore scope
4 Conflict handling
5 Preflight
6 Review
7 Restore
8 Verification
```

Review MUST distinguish:

- what will be overwritten;
- what will be preserved;
- expected downtime;
- credential/trust implications;
- verification plan.

### Wizard success state

Do not end complex workflows with only “Success”.

Show:

- what was created/changed;
- operation/execution identity;
- current readiness;
- next useful action;
- link to the created/updated resource;
- link to operation/evidence details when relevant.

Example:

```text
Application created

demo
Target local
READY

Execution exec-01J...
12 resources reconciled

[Open application] [View operation]
```

### Wizard failure state

Failure MUST keep the workflow recoverable.

Show:

- failed step/operation;
- structured BaseHarbor problem;
- completed work if mutation already began;
- whether retry is safe;
- remediation/rollback options from Core;
- operation/evidence link.

Do not discard the wizard state after failure.

### Accessibility

Wizards MUST additionally provide:

- a programmatic step title;
- announced validation errors;
- focus moved to the first relevant error after failed Next/Review;
- keyboard-accessible step navigation;
- no focus trap outside intentional modal subflows;
- no automatic focus jumps while async validation completes;
- accessible progress/step semantics;
- clear disabled-state explanations where needed.

### Wizard usability checklist

Before a wizard is considered complete:

- [ ] Does every step have one coherent decision goal?
- [ ] Are defaults/provenance understandable?
- [ ] Are required/policy-controlled values distinguishable?
- [ ] Can the user safely go Back without losing work?
- [ ] Are dependency changes surfaced rather than silently reset?
- [ ] Are validation errors shown before Apply where predictable?
- [ ] Is async discovery understandable and retryable?
- [ ] Is Review based on effective state?
- [ ] Is a semantic plan/diff available where applicable?
- [ ] Are destructive consequences explicit?
- [ ] Is success actionable?
- [ ] Is failure recoverable?
- [ ] Are secrets excluded from unsafe client persistence?
- [ ] Is the entire flow keyboard/screen-reader usable?

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
- [ ] Does every apparently executable control have a real handler or an explicit contract-pending state?
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
