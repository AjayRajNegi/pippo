/**
 * Core message protocol for webview <-> extension host communication.
 * All messages are versioned and validated at runtime.
 */

// Version of the message protocol. Increment when making breaking changes.
export const MESSAGE_PROTOCOL_VERSION = 1;

// Base message interface
export interface BaseMessage {
  readonly version: number;
  readonly type: string;
  readonly requestId?: string; // For request-response correlation
}

// Webview -> Extension host messages (user intents)
export interface WebviewToExtensionMessage extends BaseMessage {
  readonly direction: "webview-to-extension";
}

export interface OpenFeatureMessage extends WebviewToExtensionMessage {
  readonly type: "openFeature";
  readonly feature:
    "routine" | "reminders" | "reports" | "projectScan" | "cleanup" | "rules";
}

export interface RoutineActionMessage extends WebviewToExtensionMessage {
  readonly type: "routineAction";
  readonly action: "start" | "pause" | "resume" | "finish" | "reset";
}

export interface ReminderActionMessage extends WebviewToExtensionMessage {
  readonly type: "reminderAction";
  readonly reminderId: string;
  readonly action:
    "snooze" | "dismiss" | "markDone" | "pause" | "enable" | "disable";
  readonly snoozeMinutes?: number;
}

export interface CreateReminderMessage extends WebviewToExtensionMessage {
  readonly type: "createReminder";
  readonly text: string;
  readonly intervalMinutes: number;
}

export interface UpdateReminderMessage extends WebviewToExtensionMessage {
  readonly type: "updateReminder";
  readonly reminderId: string;
  readonly text?: string;
  readonly intervalMinutes?: number;
  readonly enabled?: boolean;
}

export interface DeleteReminderMessage extends WebviewToExtensionMessage {
  readonly type: "deleteReminder";
  readonly reminderId: string;
}

export interface ToggleTrackingMessage extends WebviewToExtensionMessage {
  readonly type: "toggleTracking";
  readonly enabled: boolean;
}

export interface RequestScanMessage extends WebviewToExtensionMessage {
  readonly type: "requestScan";
}

export interface RequestCleanupPreviewMessage extends WebviewToExtensionMessage {
  readonly type: "requestCleanupPreview";
}

export interface ConfirmCleanupMessage extends WebviewToExtensionMessage {
  readonly type: "confirmCleanup";
  readonly targets: readonly string[];
}

export interface CreateRuleMessage extends WebviewToExtensionMessage {
  readonly type: "createRule";
  readonly rule: RuleDefinition;
}

export interface UpdateRuleMessage extends WebviewToExtensionMessage {
  readonly type: "updateRule";
  readonly ruleId: string;
  readonly rule: Partial<RuleDefinition>;
}

export interface DeleteRuleMessage extends WebviewToExtensionMessage {
  readonly type: "deleteRule";
  readonly ruleId: string;
}

export interface InferRulesMessage extends WebviewToExtensionMessage {
  readonly type: "inferRules";
}

export interface ClearHistoryMessage extends WebviewToExtensionMessage {
  readonly type: "clearHistory";
  readonly confirm: boolean;
}

export interface GetStateMessage extends WebviewToExtensionMessage {
  readonly type: "getState";
}

// Extension -> Webview messages (display state, updates)
export interface ExtensionToWebviewMessage extends BaseMessage {
  readonly direction: "extension-to-webview";
}

export interface InitialStateMessage extends ExtensionToWebviewMessage {
  readonly type: "initialState";
  readonly state: ExtensionState;
}

export interface StateUpdateMessage extends ExtensionToWebviewMessage {
  readonly type: "stateUpdate";
  readonly state: Partial<ExtensionState>;
}

export interface RoutineStateMessage extends ExtensionToWebviewMessage {
  readonly type: "routineState";
  readonly routine: RoutineState;
}

export interface ReminderUpdateMessage extends ExtensionToWebviewMessage {
  readonly type: "reminderUpdate";
  readonly reminders: readonly ReminderState[];
  readonly triggered?: readonly string[]; // IDs of reminders that just triggered
}

export interface ReportDataMessage extends ExtensionToWebviewMessage {
  readonly type: "reportData";
  readonly daily: DailyReport | null;
  readonly weekly: WeeklyReport | null;
}

export interface ScanResultMessage extends ExtensionToWebviewMessage {
  readonly type: "scanResult";
  readonly tree: ProjectTreeNode;
  readonly diagnostics: readonly Diagnostic[];
}

export interface CleanupPreviewMessage extends ExtensionToWebviewMessage {
  readonly type: "cleanupPreview";
  readonly targets: readonly CleanupTarget[];
}

export interface CleanupResultMessage extends ExtensionToWebviewMessage {
  readonly type: "cleanupResult";
  readonly results: readonly CleanupResult[];
}

export interface RulesListMessage extends ExtensionToWebviewMessage {
  readonly type: "rulesList";
  readonly rules: readonly RuleState[];
}

export interface InferredRulesMessage extends ExtensionToWebviewMessage {
  readonly type: "inferredRules";
  readonly rules: readonly RuleDefinition[];
}

export interface ErrorMessage extends ExtensionToWebviewMessage {
  readonly type: "error";
  readonly code: string;
  readonly message: string;
}

export interface LogMessage extends ExtensionToWebviewMessage {
  readonly type: "log";
  readonly level: "info" | "warn" | "error";
  readonly message: string;
}

// Union types for validation
export type IncomingMessage =
  | OpenFeatureMessage
  | RoutineActionMessage
  | ReminderActionMessage
  | CreateReminderMessage
  | UpdateReminderMessage
  | DeleteReminderMessage
  | ToggleTrackingMessage
  | RequestScanMessage
  | RequestCleanupPreviewMessage
  | ConfirmCleanupMessage
  | CreateRuleMessage
  | UpdateRuleMessage
  | DeleteRuleMessage
  | InferRulesMessage
  | ClearHistoryMessage
  | GetStateMessage;

export type OutgoingMessage =
  | InitialStateMessage
  | StateUpdateMessage
  | RoutineStateMessage
  | ReminderUpdateMessage
  | ReportDataMessage
  | ScanResultMessage
  | CleanupPreviewMessage
  | CleanupResultMessage
  | RulesListMessage
  | InferredRulesMessage
  | ErrorMessage
  | LogMessage;

// State types
export interface ExtensionState {
  readonly routine: RoutineState;
  readonly reminders: readonly ReminderState[];
  readonly trackingEnabled: boolean;
  readonly quietHours: QuietHours | null;
}

export interface RoutineState {
  readonly status: "idle" | "running" | "paused" | "finished";
  readonly mode: "work" | "break" | "longBreak";
  readonly workDurationMinutes: number;
  readonly breakDurationMinutes: number;
  readonly longBreakDurationMinutes: number;
  readonly cyclesUntilLongBreak: number;
  readonly completedCycles: number;
  readonly startedAt: number | null; // timestamp
  readonly pausedAt: number | null; // timestamp
  readonly elapsedMs: number;
  readonly endsAt: number | null; // timestamp
}

export interface ReminderState {
  readonly id: string;
  readonly text: string;
  readonly intervalMinutes: number;
  readonly enabled: boolean;
  readonly nextTriggerAt: number | null; // timestamp
  readonly lastTriggeredAt: number | null; // timestamp
  readonly snoozedUntil: number | null; // timestamp
  readonly isOverdue: boolean;
}

export interface QuietHours {
  readonly startHour: number; // 0-23
  readonly startMinute: number; // 0-59
  readonly endHour: number; // 0-23
  readonly endMinute: number; // 0-59
  readonly timezone: string; // IANA timezone
}

export interface DailyReport {
  readonly date: string; // YYYY-MM-DD in local timezone
  readonly estimatedActiveMinutes: number;
  readonly sessionCount: number;
  readonly completedWorkCycles: number;
  readonly completedBreakCycles: number;
  readonly reminderOutcomes: ReminderOutcome[];
}

export interface ReminderOutcome {
  readonly reminderId: string;
  readonly reminderText: string;
  readonly completed: boolean;
  readonly snoozedCount: number;
  readonly dismissedCount: number;
}

export interface WeeklyReport {
  readonly weekStart: string; // YYYY-MM-DD (Monday)
  readonly dailyBreakdown: readonly DailyReport[];
  readonly totalActiveMinutes: number;
  readonly averageDailyMinutes: number;
  readonly totalWorkCycles: number;
  readonly totalBreakCycles: number;
  readonly trend: "up" | "down" | "stable" | "insufficient-data";
}

export interface ProjectTreeNode {
  readonly name: string;
  readonly path: string; // relative to workspace root
  readonly type: "file" | "directory";
  readonly children?: readonly ProjectTreeNode[];
  readonly isExcluded?: boolean;
  readonly diagnosticCount?: number;
}

export interface Diagnostic {
  readonly id: string;
  readonly category:
    "generated" | "missing-ignore" | "config-contradiction" | "info";
  readonly severity: "info" | "warning" | "error";
  readonly message: string;
  readonly evidencePath?: string; // relative path
  readonly suggestedAction?: string;
  readonly dismissible: boolean;
}

export interface CleanupTarget {
  readonly path: string; // relative to workspace root
  readonly name: string;
  readonly estimatedSizeBytes: number | null; // null if unknown
  readonly type: "generated" | "dependencies";
}

export interface CleanupResult {
  readonly path: string;
  readonly success: boolean;
  readonly error?: string;
  readonly skipped?: boolean;
  readonly skipReason?: string;
}

export interface RuleDefinition {
  readonly id: string;
  readonly name: string;
  readonly pattern: string; // glob pattern
  readonly condition?: RuleCondition;
  readonly description: string;
  readonly severity: "info" | "warning" | "error";
  readonly createdAt: number; // timestamp
  readonly updatedAt: number; // timestamp
}

export interface RuleCondition {
  readonly type: "extension" | "directory" | "name-pattern";
  readonly value: string;
}

export interface RuleState extends RuleDefinition {
  readonly violations: readonly RuleViolation[];
}

export interface RuleViolation {
  readonly filePath: string;
  readonly message: string;
  readonly suggestedFix?: string;
}

// Type guards for runtime validation
export function isIncomingMessage(msg: unknown): msg is IncomingMessage {
  if (!msg || typeof msg !== "object") return false;
  const m = msg as Record<string, unknown>;
  return (
    typeof m.version === "number" &&
    typeof m.type === "string" &&
    m.direction === "webview-to-extension"
  );
}

export function isOutgoingMessage(msg: unknown): msg is OutgoingMessage {
  if (!msg || typeof msg !== "object") return false;
  const m = msg as Record<string, unknown>;
  return (
    typeof m.version === "number" &&
    typeof m.type === "string" &&
    m.direction === "extension-to-webview"
  );
}

export function validateIncomingMessage(msg: unknown): IncomingMessage {
  if (!isIncomingMessage(msg)) {
    throw new Error("Invalid incoming message format");
  }
  if (msg.version !== MESSAGE_PROTOCOL_VERSION) {
    throw new Error(`Unsupported protocol version: ${msg.version}`);
  }
  return msg;
}
