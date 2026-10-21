# Feature Specification: Repository Companion

## Purpose

Offer understandable, low-noise insight into a repository and provide safe project maintenance. Repository findings must be evidence-based; unfamiliar structure is not automatically wrong.

## R1 — Project overview, tree, and bounded diagnostics

### Behavior

- Identify basic project signals using local files and configuration (for example, package manifests, lockfiles, framework config, and version-control presence).
- Generate a readable tree of relevant directories/files with sensible depth/size controls and configured exclusions.
- Detect a small, explicit set of maintenance findings for the MVP, such as common generated directories, missing expected ignore patterns where evidence is clear, and unsupported/contradictory project configuration signals.
- Each finding includes a category, concise explanation, evidence/path (only in the local UI), severity, and a suggested next action where possible.
- Keep this diagnostic set bounded and documented. Do not label subjective folder choices as errors unless an explicit rule exists; those checks belong to R2.
- Full scans are triggered on demand or at a suitable first-use point. Later scans should be incremental and avoid duplicate findings.

### Acceptance criteria

1. A developer can request a repository tree without a network request.
2. Excluded directories are not recursively crawled and their contents are not shown by default.
3. Findings can be explained and dismissed; informational findings do not trigger repetitive popups.
4. Unsupported or ambiguous situations result in “unable to determine” rather than invented certainty.

## R2 — Explicit naming and file-placement rules

### Behavior

- Let a developer create and edit simple, explicit rules for file/directory naming and permitted locations.
- Rules can use path patterns and basic matching conditions; the format must be versioned and validated when implemented.
- Offer to infer a starter rule set from existing patterns, but require the user to review and save it before those rules become authoritative.
- When files are created, renamed, or saved, evaluate only relevant rules and debounce noisy event bursts.
- If an explicit rule is violated, explain the rule and offer a suggested correction. Do not move/rename files automatically.
- If no clear rule applies, remain quiet or say the convention is unknown. Do not call AI automatically. Optional AI assistance is a future feature outside the MVP.
- Do not continuously rescan every file on every editor event.

### Acceptance criteria

1. An explicit rule can be tested against matching and non-matching paths.
2. The user sees which rule triggered a finding and can ignore/dismiss it.
3. No recommendation is presented as authoritative when only a weak inferred pattern exists.
4. Rule parsing rejects invalid configuration safely and gives a clear local explanation.

## R3 — Safe project cleanup

### Behavior

- The first supported targets include common generated paths such as `.next/` and `node_modules/`; additional targets must be explicit and documented.
- Show each target path and estimated size before cleanup. Size may be unavailable or approximate; disclose that rather than blocking on a costly scan.
- Provide a preview of the exact targets that will be removed and require explicit confirmation at execution time.
- Revalidate the target immediately before deleting it. Reject targets outside the intended workspace/allowed locations, root paths, path traversal, and dangerous symlink resolutions.
- Never delete source files, unrecognized directories, lockfiles, or dependencies as a side effect of general “clean” behavior. In particular, removing `node_modules/` is only done after an explicit user selection because reinstalling it can be costly.
- A dry-run/preview path must be available without deleting anything.
- Report successful, skipped, and failed targets individually. Partial failures must not be presented as full success.

### Acceptance criteria

1. The user can preview cleanup with no filesystem changes.
2. The confirmation describes the exact targets, and only those targets are attempted.
3. Unsafe paths and symlink/path traversal attempts are rejected by tested logic.
4. The extension reports the outcome accurately and handles permission errors.
5. Tests use temporary fixtures and never delete real developer data.

## Shared repository constraints

- Core scanning, rules, and cleanup work locally without AI/network services.
- Treat workspace files and project-provided rules as untrusted input.
- Respect ignore/exclusion settings and avoid dependency/build output traversal.
- Keep diagnostics available in a report/view; use a popup only when the issue is actionable and warrants attention. See [UI behavior](../ui-behavior.md).
- Architecture and module ownership are defined in [architecture](../architecture.md).
