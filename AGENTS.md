# Instructions for AI Coding Agents

## Purpose

Build the Droid Companion VS Code extension according to the accepted product scope and feature specifications. Optimize for correctness, low resource use, privacy, and code a human developer can understand and debug.

## Read the relevant context

1. Start with [`docs/README.md`](docs/README.md) to find the source of truth for a question.
2. Read [`docs/product-scope.md`](docs/product-scope.md) before proposing or implementing product behavior.
3. Read [`docs/architecture.md`](docs/architecture.md) for boundaries and ownership.
4. Read only the relevant feature specification(s), UI behavior, privacy, and testing documents for the task.

Do not load every document for every small task. Prefer the narrowest context that fully describes the task.

## Source-of-truth rules

- MVP boundaries and non-goals: `docs/product-scope.md`.
- Component boundaries, ownership, communication, and storage placement: `docs/architecture.md`.
- Well-being scheduling and activity semantics: `docs/feature-specs/wellbeing.md`.
- Repository scanning, rules, and cleanup behavior: `docs/feature-specs/repository.md`.
- Character states, wheel, placement, and interaction behavior: `docs/ui-behavior.md`.
- Data collection, consent, privacy, and retention: `docs/privacy-and-telemetry.md`.
- Test strategy and performance validation: `docs/testing.md`.

When a requirement changes, edit its canonical document and update only necessary cross-references elsewhere. Do not copy entire feature specifications into other files.

## Implementation rules

- Use TypeScript with strict type checking for the extension and webview.
- Use React function components and hooks in the webview. Do not introduce class-based React components.
- Keep VS Code APIs, file-system operations, scheduling, persistence, and feature logic in the extension host. The webview is presentation-only and communicates through a typed, validated message protocol.
- Keep modules small and responsibilities explicit. Prefer straightforward functions and composition over unnecessary abstractions or generic frameworks.
- Core MVP behavior must not depend on a remote AI service. Do not add AI calls, web browsing, a database server, or new product scope without an approved decision.
- Prefer VS Code APIs and existing dependencies already in the project. Add a dependency only when its value exceeds its maintenance, bundle, and runtime cost.
- Treat repository contents and workspace configuration as untrusted input. Validate messages and paths at trust boundaries.
- Never perform destructive file operations without showing the exact target set and obtaining explicit confirmation.
- Do not collect source code, document contents, keystrokes, cursor positions, workspace paths, or personal well-being records for product analytics.
- Respect the VS Code telemetry-enabled API and the extension's explicit telemetry choice. A disabled VS Code telemetry setting always blocks extension telemetry.
- Avoid tight polling loops, unnecessary watchers, repeated full scans, hidden-view animation work, and unbounded queues. Dispose listeners, timers, watchers, and other resources on deactivation.
- Use accessible controls, keyboard navigation, visible focus states, adequate contrast, and reduced-motion support.

## Task workflow

For each implementation task:

1. Identify its canonical specification and acceptance criteria.
2. Inspect current code and tests before changing anything.
3. Make the smallest coherent change; do not refactor unrelated code.
4. Write or update tests for behavior and important edge cases.
5. Run the relevant tests, lint, type check, and build commands that exist in the repository. Do not claim a command passed unless it was run successfully.
6. Review the diff for privacy leaks, unsafe file operations, unnecessary dependencies, resource leaks, and accidental scope expansion.
7. Report files changed, checks actually run and their results, and any unresolved assumptions.

If the documentation is genuinely ambiguous, do not silently invent a product decision. Choose a conservative implementation only if reversible, state the assumption, and flag it for the owner. For destructive, privacy-sensitive, or architecture-changing decisions, stop and ask before proceeding.

## Documentation maintenance

Update the canonical document when implementation reveals a necessary specification change. Keep documentation concise and non-duplicative. Do not create a second source of truth for an existing decision.
