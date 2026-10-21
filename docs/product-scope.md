# Product Scope — MVP v0.1

## Product statement

Droid Companion is a calm, friendly VS Code companion that helps developers maintain personal working routines and keep their repositories organized. The droid is the user's **friend**, not a pet or productivity supervisor. Its presence should feel reassuring rather than demanding.

The product is companion-first: the droid and quick actions are the default experience; a chat interface is reserved for tasks that genuinely need a conversation.

## MVP feature groups

### 1. Personal well-being

Included in the MVP:

- A built-in Pomodoro preset and user-configurable work/break routines.
- User-defined reminders, including water, eye rest, stretching, short breaks, and arbitrary personal reminders.
- Pause, snooze, dismiss, quiet hours, and configurable reminder intervals.
- Opt-in estimates of active VS Code time.
- Local daily and weekly summaries of estimated work time and routine activity.

Behavioral details belong in [the well-being specification](feature-specs/wellbeing.md).

### 2. Repository companion

The first three capabilities are:

1. Project overview, repository tree, and bounded diagnostics.
2. Explicit naming and file-placement rules, with suggestions based on existing patterns only when evidence supports them.
3. Safe cleanup of supported generated files/directories, using previews and confirmation.

Detailed behavior and safety requirements belong in [the repository specification](feature-specs/repository.md).

### 3. Developer extras and extensibility

The MVP includes the architecture needed to add capabilities without rewriting the core, plus the built-in actions already listed in this scope. A public API or user-authored feature/plugin system is **not** included in the MVP. It may be designed after the first version validates which extension points users need.

AI reasoning, autonomous coding, web research, and remote AI providers are not required for any MVP feature.

## Companion UI requirements

- A compact companion view sits below the file list in the Explorer container.
- The MVP has four primary states—hanging out, working, resting/sleeping, and helping/interacting—with brief movement animations as transitions or accents.
- A GTA-inspired radial action wheel provides quick access to core actions, with an accessible non-radial alternative.
- Reminders and findings use calm, compact cues. The UI must not create a popup for every event.
- The little room and detailed environmental scenery are part of the MVP but are implemented **last**. A simpler companion view can be used until then.

Visible behavior is defined in [UI behavior](ui-behavior.md); this document only establishes scope.

## Privacy and runtime constraints

- Core features run locally and work without an AI API key.
- Well-being settings, activity records, and reports remain local by default.
- Product analytics are separate from personal activity records and must follow [privacy and telemetry](privacy-and-telemetry.md).
- The extension must be conservative with CPU, memory, disk access, and background work. Performance verification is defined in [testing](testing.md).

## Explicitly out of scope

- Public feature marketplace or user-created executable modules.
- Autonomous AI coding agent or mandatory AI API calls.
- Web browsing/research inside the companion.
- Cloud accounts, synchronization of personal activity, or social/leaderboard features.
- Medical advice or claims that activity estimates measure true productivity.
- Activity reminders after VS Code is closed.
- Automatic file moves/renames based only on inferred patterns.
- Unreviewed or heuristic deletion of arbitrary files, source files, or dependencies.

## MVP completion principle

The MVP is complete when the included behavior is implemented, tested, accessible, privacy-conscious, and responsive enough for normal development use—not when every later idea is represented by an empty button or placeholder.
