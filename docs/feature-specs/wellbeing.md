# Feature Specification: Personal Well-being

## Purpose

Help the user follow their chosen work/rest routine and review a transparent estimate of their VS Code activity. This feature is supportive, optional, and never a measure of personal worth or guaranteed productivity.

## Requirements

### Routines

- Provide a Pomodoro preset (25 minutes work, 5 minutes break) and configurable work/break durations.
- Support a configurable longer break after a chosen number of work cycles.
- Allow the user to start, pause, resume, finish, or reset a routine.
- Allow reminders/routines to be enabled independently. No forced breaks.
- Persist enough state to handle extension reloads safely; on restart, reconcile timestamps rather than replaying every missed reminder.

### Personal reminders

- Include starter reminders for drinking water, resting eyes, stretching/moving, and taking a short break.
- Allow custom reminder text and intervals; no AI or code is needed to create one.
- Provide snooze, dismiss, mark-done, pause, quiet hours, and a global reminders-off control.
- Do not repeatedly notify for missed reminders. Coalesce overdue reminders and apply quiet hours.
- Face-washing/cool-water reminders are allowed as user-defined reminders, not prescribed or framed as medical advice.
- The user can customize frequency and choose a calm notification style as defined in [UI behavior](../ui-behavior.md).

### Active VS Code time estimate

- Activity tracking is opt-in and can be paused at any time.
- The estimate may use coarse signals such as VS Code window focus and editor interaction timestamps. Do not capture or persist typed text, clipboard data, raw keypresses, cursor positions, or file contents.
- A focused VS Code window alone is not sufficient to claim continuous active work. Apply an inactivity threshold (initial default: five minutes since a qualifying editor activity signal), and allow the user to configure or disable tracking.
- Record time segments or timestamps, not a continuously running counter. Resolve durations from timestamps and handle restart, pause, focus changes, sleep/wake, and clock/time-zone changes defensively.
- Describe the value as “estimated active VS Code time,” not productive time or total work time across other apps.
- Never use this data for product telemetry.

### Daily and weekly reports

- Keep records local by default.
- Daily summaries include estimated active VS Code time, number of sessions, completed work/break cycles, and reminder outcomes only where those outcomes are explicitly recorded.
- Weekly summaries include a daily breakdown, weekly total, daily average, and a simple comparison/trend based on available records.
- Missing data must be shown as missing, not treated as zero activity.
- Use the user's local calendar for day boundaries and handle daylight-saving/time-zone changes where relevant.
- Provide a way to clear stored history. Do not include source-code or project file details in reports.

## Acceptance criteria

1. A user can run the default Pomodoro routine without configuring anything.
2. A user can create a custom work/break schedule and a custom reminder without AI or network access.
3. Snoozed and overdue reminders do not create a notification storm after sleep, reload, or prolonged inactivity.
4. Tracking can be disabled and paused; no raw editor content or keystrokes are stored.
5. Daily and weekly reports are calculated from local records and clearly identify the values as estimates.
6. Clearing history removes the well-being records owned by this feature.
7. Unit tests cover pause/resume, inactivity cutoff, duplicate reminders, missed intervals, time boundaries, and recovery after extension restart.

## Out of scope

Medical advice, biometric monitoring, measuring productivity, cross-device synchronization, cloud storage, and background reminders while VS Code is closed.
