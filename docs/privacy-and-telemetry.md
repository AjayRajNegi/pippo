# Privacy and Telemetry

## Principles

Collect the minimum data needed. Personal well-being records and product analytics are separate systems with different purposes. Local features must remain useful when telemetry is disabled or unavailable.

## Data classes and handling

| Data | Purpose | Storage/transfer rule |
|---|---|---|
| Routine settings and reminder text | Run the user's chosen routines | Local only by default; never send to product analytics |
| Activity segments and daily/weekly reports | Estimate active VS Code time and summarize it | Local only; never upload or sync by default |
| Project rules | Apply explicit repository conventions | Local workspace state or a project config the user explicitly chooses to save; never upload by default |
| Repository tree and findings | Explain the open workspace | Process locally; do not send file paths/content to analytics |
| Product usage events | Estimate adoption and feature usage | Optional, minimal, consent-based telemetry only; no feature use until a compliant endpoint/provider is configured |
| Errors | Diagnose extension failures | Local logs by default; any remote reporting must be separately reviewed and must exclude secrets, source text, paths, and identifying payloads |

Do not collect source code, file contents, file names/absolute paths, workspace/project names, Git remotes, raw keystrokes, clipboard contents, cursor positions, personal reminder content, health routine status, session durations, or report details for product analytics.

## Telemetry policy

- Provide a clear extension-specific telemetry setting and explain the exact event categories before enabling it. The proposed default is **off until the user opts in**.
- Respect VS Code's `env.isTelemetryEnabled` value and `onDidChangeTelemetryEnabled` event. If VS Code telemetry is disabled, the extension must not transmit telemetry even if the extension-specific setting is enabled.
- Prefer the official `@vscode/extension-telemetry` package if a compatible service is selected; otherwise any custom transport must follow the same consent and opt-out rules.
- Use a small, fixed event schema, such as `extension_activated`, `feature_opened`, `feature_action_completed`, and `operation_failed`, with coarse feature/action categories and extension version. Do not attach arbitrary logs or payloads.
- Avoid a stable installation identifier unless product analytics cannot answer the defined question without one. If one is later approved, make its purpose and reset/deletion behavior clear and document its pseudonymous nature.
- Never block features on telemetry. Queue size must be bounded; failed delivery must not retry indefinitely. Do not transmit any event until the user has consented and telemetry is permitted by VS Code.
- When telemetry is disabled, stop future sending and clear unsent queued events. Do not backfill historical usage after the user opts in.
- Provide a privacy notice with the collected event list, purpose, endpoint/provider, retention period, and contact/reporting path before telemetry is released.

Official guidance: [VS Code telemetry guide for extension authors](https://code.visualstudio.com/api/extension-guides/telemetry). This project must follow current guidance at implementation time; this document is not legal advice.

## Data lifecycle

- Activity history has a user-accessible clear/reset action.
- Define and test bounded retention for local activity history before shipping; do not retain it forever by accident. The initial implementation should propose a configurable retention window (default 90 days) and document it in settings/help.
- Project rules are not copied to telemetry. If rules are saved into a repository file, inform the user that the file may be committed/shared with that repository.
- No accounts, remote profile, cloud sync, AI provider, or web research are part of the MVP.
- If future functionality adds network access or user-defined executable features, it requires a separate threat/privacy review before implementation.

## Acceptance criteria

1. Core features work when offline and with telemetry disabled.
2. No telemetry is emitted without explicit consent and permission from VS Code's telemetry API.
3. Automated tests verify that disabled telemetry, changed telemetry permission, and failed network delivery cannot leak events.
4. Telemetry payloads are built from allowlisted fields rather than arbitrary objects/log messages.
5. Personal activity and reminder data are not reachable from the telemetry module through its interfaces.
6. Logs are sanitized and do not contain source content, secrets, or absolute workspace paths.
