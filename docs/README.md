# Documentation Map

This folder is the planning source of truth for the Droid Companion VS Code extension. Documents intentionally have different responsibilities; avoid duplicating detailed requirements across them.

## Read by task

| If working on… | Read… | Owns… |
|---|---|---|
| Product scope or prioritization | [Product scope](product-scope.md) | MVP inclusions, exclusions, and implementation order |
| System design, modules, messages, persistence, performance boundaries | [Architecture](architecture.md) | Responsibilities and technical boundaries |
| Timers, routines, reminders, active-time estimates, reports | [Well-being feature spec](feature-specs/wellbeing.md) | Well-being behavior and edge cases |
| Repo tree, diagnostics, naming rules, cleanup | [Repository feature spec](feature-specs/repository.md) | Repository feature behavior and safety rules |
| Droid states, action wheel, notifications, view layout | [UI behavior](ui-behavior.md) | Visible interaction and animation rules |
| Analytics, personal data, consent, retention | [Privacy and telemetry](privacy-and-telemetry.md) | Data policy and collection boundaries |
| Unit/integration tests and performance checks | [Testing](testing.md) | Verification strategy and quality gates |
| Agent working style | [`../AGENTS.md`](../AGENTS.md) | How coding agents use and update these docs |

## Decision hierarchy

1. `product-scope.md` decides **what is in the MVP**.
2. The relevant feature specification decides **how that feature should behave**.
3. `architecture.md` decides **where responsibilities live and how components communicate**.
4. `ui-behavior.md` decides **how behavior is presented and interacted with**.
5. `privacy-and-telemetry.md` overrides implementation convenience whenever data handling or consent is involved.
6. `testing.md` defines how changes must be verified.

If documents conflict, do not guess silently. Update the canonical document and its minimal cross-references in the same change.

## Status and unresolved items

These are planning documents, not proof that the extension has been implemented. The visual design, droid artwork, exact reminder copy, and detailed room scenery are intentionally not finalized. The product name is also provisional.

The build scaffold, package scripts, telemetry endpoint/provider, and detailed performance budgets must be confirmed during environment setup. No telemetry should be sent until a compliant provider and explicit settings are implemented.
