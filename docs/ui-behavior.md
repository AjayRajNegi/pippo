# UI Behavior and Droid States

## Design intent

The droid is the user's friendly coding companion. It should feel cheerful, calm, and respectful—not like a pet, supervisor, or productivity judge. Final artwork, color palette, exact character proportions, and room decoration remain open for the later UI design stage.

The UI owns presentation. Feature logic and authoritative state live in the extension host, as described in [architecture](architecture.md).

## Placement

- Use one companion Webview View in the Explorer container, below the file list where practical.
- Keep its default footprint compact and useful when the Explorer is narrow.
- Do not rely on unsupported workbench-DOM injection or a floating overlay that the VS Code API does not provide.
- Include normal VS Code commands and an accessible action list so the radial wheel is not the only route to a feature.

## Primary states

1. **Hanging out** — default calm state; subtle idle movement, occasional blink or look-around.
2. **Working** — a focused pose, such as sitting with a tiny laptop, when a work session is active.
3. **Resting/sleeping** — a peaceful pose during a scheduled break or when the user explicitly puts the companion to rest.
4. **Helping/interacting** — attentive pose while presenting a reminder, result, or user-requested action.

A brief **transition animation** may connect states. Tiny walk, bounce, stretch, or hop animations are transient accents, not additional persistent states. Reminder attention cues are also overlays, not a fifth primary state.

The droid must not infer that the user is unproductive because keyboard or editor activity is quiet. State changes should follow explicit routine/session state or relevant UI interaction, not judgmental heuristics.

## Reminder and finding cues

- Prefer subtle indicators and a short, dismissible callout over recurring system popups.
- A pending reminder may use a small dot or a gentle contextual animation. Use color and movement sparingly; red is reserved for genuinely urgent conditions, not ordinary wellness reminders.
- Avoid escalating into frantic movement by default. If playful agitation is ever offered, it must be optional, easy to disable, and must not flash or loop continuously.
- A reminder offers only relevant actions, such as mark done, snooze, dismiss, or open routine settings.
- Significant repository findings may show a compact summary with a `Review findings` action. Detailed results belong in the companion view rather than a chain of popups.
- Do not open a chat for ordinary reminders or routine findings. Conversation UI is reserved for a request or issue that needs clarification or multiple turns.

## Radial action wheel

The wheel is a quick-action launcher inspired by radial game menus, not a replica of any game's artwork or assets. Initial actions:

- Work/break routine
- Reminders
- Daily/weekly reports
- Project scan/tree
- Cleanup preview
- Project rules

Requirements:

- Support pointer, keyboard, and focus navigation; label each action and expose accessible names.
- Provide a conventional list/command fallback for small widths, reduced-motion settings, keyboard-only users, and assistive technology.
- Escape closes the wheel; focus returns to the invoking control; opening/closing must not trigger the selected action accidentally.
- Avoid complicated hover-only interactions.

## Motion and accessibility

- Respect `prefers-reduced-motion`; replace or omit nonessential animations when requested.
- Use CSS transforms/opacity and lightweight SVG where possible. Avoid continuous animation when the view is hidden or the companion is in a static state.
- Ensure usable contrast, keyboard access, visible focus, meaningful labels, and a non-color-only way to communicate attention.
- Animation should reinforce meaning and personality, never conceal an error or delay access to controls.

## Room implementation order

The room is included in MVP scope but is the last planned UI feature to implement. First deliver a functional compact companion view with placeholder/simple background and all interaction states. Add environmental scenery only after state behavior, reminders, action wheel, and repository interactions are working. The room should remain decorative and must not own feature state.
