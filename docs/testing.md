# Testing and Quality Strategy

## Purpose

Tests are a primary safety mechanism because the project will be implemented with AI coding agents and includes time calculations, file operations, workspace events, and a webview message boundary.

This document owns verification methods and release checks; feature-specific expected behavior is defined in the relevant feature specifications.

## Tooling direction

- **Vitest:** unit tests for pure logic and service behavior.
- **React Testing Library:** interaction-focused tests for React components.
- **VS Code extension test harness:** integration tests in an Extension Development Host, using `@vscode/test-cli` and `@vscode/test-electron` where the supported runtime permits.
- **ESLint + Prettier:** lint and formatting.
- **TypeScript strict mode:** static type checking.
- **esbuild:** production bundle verification.

Exact dependency versions and `package.json` scripts will be selected when the environment scaffold is generated. Do not invent passing test results or commit generated build artifacts unless explicitly required.

## Required quality commands

The scaffold should expose a single aggregate check command (provisionally `npm run check`) that runs formatting/lint validation, type checking, unit tests, and build validation. Provide separate commands for unit tests and VS Code integration tests. Document any commands that require a display, browser, or platform dependency.

Until those scripts exist, agents must run the applicable commands currently defined in `package.json` and report missing commands as setup work—not as test failures or successes.

## Test levels

### Unit tests

Test deterministic logic without starting VS Code wherever possible:

- Routine schedule calculation, pauses/resumes, overdue reminders, snoozing, quiet hours, and local-date boundaries.
- Active-time segmentation, inactivity cutoff, clock changes, and restart reconciliation.
- Daily/weekly report aggregation with missing data and time-zone boundaries.
- Repository exclusions, tree generation, rule matching, invalid rule configuration, and incremental event batching.
- Cleanup target normalization, preview generation, path traversal/symlink defenses, confirmation requirements, and partial failures.
- Runtime validation and rejection of malformed webview messages.
- Telemetry allowlisting, disabled state, queue bounds, and sanitized errors.

Use injected clocks and filesystem adapters where that makes tests deterministic. Avoid tests that wait for real-time intervals.

### UI tests

- Test meaningful user-visible behavior rather than implementation details.
- Verify action-wheel keyboard/focus behavior and its conventional fallback.
- Verify reminder controls, error/finding summaries, and transitions among primary droid states.
- Verify reduced-motion behavior and that controls have accessible names.
- Verify webview messages are emitted only for user actions and malformed host data renders safely.

### VS Code integration tests

- Activation/deactivation and disposable cleanup.
- View registration and restoration.
- Workspace/folder handling and empty-workspace behavior.
- File create/rename/delete event handling, excluded directories, and command registration.
- Storage recovery after extension reload/restart.
- Cleanup confirmation flow using temporary fixture directories only.

### Manual release checks

- Test at least one small and one large real-world repository.
- Inspect startup/activation cost, idle CPU use, memory, scan duration, and UI responsiveness.
- Test hidden and collapsed companion views, window blur/focus, sleep/wake, and VS Code restart.
- Test light/dark themes, narrow sidebar width, keyboard-only navigation, and reduced motion.
- Verify telemetry defaults, opt-out behavior, and privacy notice before any release that transmits data.

## Performance checks

Do not set an arbitrary memory cap before collecting a baseline. Record a reproducible baseline for VS Code with the extension disabled and enabled, then define a budget for incremental idle memory, startup/activation delay, scan duration, and idle CPU use. The idle companion should not continuously consume meaningful CPU when no work is due and no animation is visible.

Performance tests must record machine/runtime context and distinguish cold scans from incremental scans. Treat regressions against the measured baseline as review items even if absolute thresholds are not yet fixed.

## Agent verification contract

For each task, the implementation report must state:

- Which tests/checks were actually run.
- Whether each passed, failed, or was not run, with a reason.
- Relevant behavior covered and important edge cases not yet covered.
- Performance/security/privacy implications, especially for file operations and telemetry.

A green unit test suite does not replace integration checks for VS Code APIs or manual review of destructive behavior.
