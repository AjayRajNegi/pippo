# Architecture

## Goals

The architecture must be easy for a developer and an AI coding agent to understand, keep routine behavior local, limit resource use, and allow new capabilities to be added without entangling existing features.

This document owns technical boundaries and data flow. Feature behavior belongs in the feature specifications; visible interactions belong in [UI behavior](ui-behavior.md).

## Technology choices

- **Language:** TypeScript with strict checking in both runtime areas.
- **Extension runtime:** VS Code Extension API, running supported extension-host APIs.
- **Companion UI:** One React webview using function components/hooks, HTML, CSS, and SVG.
- **Build:** esbuild is the initial preferred bundler; confirm exact scaffold and scripts during environment setup.
- **Persistence:** VS Code configuration and extension storage APIs; no database server for the MVP.
- **Testing:** Vitest for isolated logic, React Testing Library for UI behavior, and the VS Code extension test harness for integration. Exact scripts are specified in [testing](testing.md).

No alternative language, native module, game engine, or remote AI runtime is justified for the MVP.

## Runtime boundary

### Extension host owns

- Extension activation/deactivation and registration/disposal of VS Code listeners.
- The schedule and event coordination for well-being routines.
- Activity-time estimation and report calculation.
- Repository scanning, project rules, diagnostics, and cleanup planning/execution.
- Reading/writing extension and workspace data.
- User approval checks before destructive operations.
- Privacy decisions and any future telemetry transport.
- Validation of all messages from the webview.

### Webview owns

- Rendering the droid, its current visual state, the action wheel, and presentation surfaces.
- Local presentation state such as wheel-open/closed, hover/focus, and transient animation state.
- Sending typed user intents to the extension host.
- Rendering data that has been explicitly supplied by the extension host.

The webview must not independently scan the workspace, delete files, own authoritative routine schedules, compute authoritative reports, or make network requests for analytics. Core feature decisions stay outside the UI.

## Suggested module boundaries

These are responsibilities, not an instruction to create an empty file for every noun. Keep the implementation proportionate to real code.

- `extension.ts`: composition root; activate features and register providers/commands.
- `core/`: shared contracts, lifecycle helpers, event coordination, and scheduling primitives where reuse is real.
- `features/wellbeing/`: routine scheduling, reminders, activity estimation, and report calculation.
- `features/repository/`: project discovery, scanning, convention rules, cleanup planning, and cleanup execution.
- `features/telemetry/`: optional product-usage events only, isolated from personal activity records.
- `platform/`: thin adapters for VS Code APIs and persistence.
- `companion/`: webview provider, typed message schemas, validation, and resource packaging.
- `webview/`: React presentation components, visual state transitions, and accessible interactions.

Avoid circular dependencies. Feature modules should depend on small interfaces/platform adapters rather than importing the UI or each other unnecessarily.

## Webview message boundary

Use a small, versioned discriminated-union protocol. Every incoming message must be validated at runtime; TypeScript types alone do not validate messages crossing the webview boundary.

- Webview → extension: user intents such as opening a feature, requesting a scan, snoozing a reminder, or confirming a proposed action.
- Extension → webview: display state, reminder/finding summaries, progress, and command outcomes.
- Destructive actions require a fresh host-side confirmation for the exact target set; a webview message alone is not sufficient authorization.
- Do not send secrets, full file contents, or unnecessary workspace metadata to the webview.
- Reject unknown message types and malformed payloads; log only a non-sensitive diagnostic category.

The concrete message schema should be implemented alongside the first UI integration and covered by tests rather than copied into this planning document.

## Persistence ownership

Use the narrowest suitable store:

- User-editable settings: VS Code configuration, with documented defaults and scope.
- Small global extension preferences: `ExtensionContext.globalState` only when a setting is not better represented as VS Code configuration.
- Workspace-specific transient state: `workspaceState` when scoped to the opened workspace.
- Larger local activity history/report data: `globalStorageUri`, with a versioned schema and retention policy.
- Workspace-shared project conventions: an explicit project configuration file only after the user chooses to create/save it. Never silently write a rules file into a repository.
- Credentials, if ever introduced: VS Code `SecretStorage`; credentials are not needed for MVP core features.

Personal activity data must not be synced or transmitted by default. Exact data categories and retention rules are owned by [privacy and telemetry](privacy-and-telemetry.md).

Reference: [VS Code data storage guidance](https://code.visualstudio.com/api/extension-capabilities/common-capabilities#data-storage).

## Resource and lifecycle requirements

- Use event-driven activation and processing, not tight polling loops.
- Register watchers only when needed, honor exclusions, batch event bursts, and dispose every timer/listener/watcher on deactivation.
- Prefer incremental analysis after a baseline scan; don't rescan the whole repository for every small change.
- The webview should not use `retainContextWhenHidden` without measured justification. Reconstruct display state from the host when shown again.
- Pause or simplify decorative animation work while the view is hidden or reduced motion is enabled.
- Run expensive operations asynchronously and provide cancellation/progress where appropriate. Never block the extension host with large synchronous filesystem operations.
- Core features must not rely on network access. Optional telemetry is governed separately by [privacy and telemetry](privacy-and-telemetry.md).

Reference: [VS Code webview UX guidance](https://code.visualstudio.com/api/ux-guidelines/webviews) and [extension host guidance](https://code.visualstudio.com/api/advanced-topics/extension-host).

## Extension points

Internal features may register a small set of typed commands, settings, and events through explicit interfaces. Do not build a public plugin loader or execute user-authored code in the MVP. Any future user feature system requires a separate security and permissions design.
