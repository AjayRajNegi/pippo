/**
 * Typed persistence layer using VS Code storage APIs.
 * All reads/writes are typed; no `any` in storage layer.
 */

import * as vscode from "vscode";
import { z } from "zod";

// ============================================================================
// Schema Versions
// ============================================================================

export const SETTINGS_SCHEMA_VERSION = 1;
export const ACTIVITY_HISTORY_SCHEMA_VERSION = 1;
export const WELLBEING_STATE_SCHEMA_VERSION = 1;

// ============================================================================
// Settings Schema (VS Code Configuration)
// ============================================================================

const QuietHoursSchema = z.object({
  enabled: z.boolean().default(false),
  startHour: z.number().int().min(0).max(23).default(22),
  startMinute: z.number().int().min(0).max(59).default(0),
  endHour: z.number().int().min(0).max(23).default(8),
  endMinute: z.number().int().min(0).max(59).default(0),
  timezone: z.string().default("UTC"),
});

const ReminderConfigSchema = z.object({
  enabled: z.boolean().default(true),
  intervalMinutes: z.number().int().positive().default(60),
});

const RemindersSchema = z.object({
  enabled: z.boolean().default(true),
  quietHours: QuietHoursSchema.default(() => ({
    enabled: false,
    startHour: 22,
    startMinute: 0,
    endHour: 8,
    endMinute: 0,
    timezone: "UTC",
  })),
  water: ReminderConfigSchema.default(() => ({ enabled: true, intervalMinutes: 60 })),
  eyeRest: ReminderConfigSchema.default(() => ({ enabled: true, intervalMinutes: 30 })),
  stretch: ReminderConfigSchema.default(() => ({ enabled: true, intervalMinutes: 60 })),
  shortBreak: ReminderConfigSchema.default(() => ({ enabled: true, intervalMinutes: 120 })),
  custom: z.array(z.object({
    id: z.string(),
    text: z.string().min(1).max(500),
    intervalMinutes: z.number().int().positive(),
    enabled: z.boolean().default(true),
  })).default([]),
});

const RoutineSettingsSchema = z.object({
  workDurationMinutes: z.number().int().positive().default(25),
  breakDurationMinutes: z.number().int().positive().default(5),
  longBreakDurationMinutes: z.number().int().positive().default(15),
  cyclesUntilLongBreak: z.number().int().positive().default(4),
});

const ActivityTrackingSchema = z.object({
  enabled: z.boolean().default(false),
  inactivityThresholdMinutes: z.number().int().positive().default(5),
});

const RetentionSchema = z.object({
  activityHistoryDays: z.number().int().positive().default(90),
  wellbeingStateDays: z.number().int().positive().default(90),
});

const TelemetrySchema = z.object({
  enabled: z.boolean().default(false),
});

export const WellbeingSettingsSchema = z.object({
  routine: RoutineSettingsSchema.default(() => ({
    workDurationMinutes: 25,
    breakDurationMinutes: 5,
    longBreakDurationMinutes: 15,
    cyclesUntilLongBreak: 4,
  })),
  reminders: RemindersSchema.default(() => ({
    enabled: true,
    quietHours: { enabled: false, startHour: 22, startMinute: 0, endHour: 8, endMinute: 0, timezone: "UTC" },
    water: { enabled: true, intervalMinutes: 60 },
    eyeRest: { enabled: true, intervalMinutes: 30 },
    stretch: { enabled: true, intervalMinutes: 60 },
    shortBreak: { enabled: true, intervalMinutes: 120 },
    custom: [],
  })),
  activityTracking: ActivityTrackingSchema.default(() => ({ enabled: false, inactivityThresholdMinutes: 5 })),
  retention: RetentionSchema.default(() => ({ activityHistoryDays: 90, wellbeingStateDays: 90 })),
  telemetry: TelemetrySchema.default(() => ({ enabled: false })),
});

export type WellbeingSettings = z.infer<typeof WellbeingSettingsSchema>;

export const DEFAULT_WELLBEING_SETTINGS: WellbeingSettings = WellbeingSettingsSchema.parse({});

// ============================================================================
// Activity History Schema (globalStorageUri)
// ============================================================================

export const ActivitySegmentSchema = z.object({
  startTime: z.number().int().nonnegative(), // Unix timestamp ms
  endTime: z.number().int().nonnegative(),
  // No raw content, just coarse signals
  signals: z.array(z.enum(["focus", "textChange", "save", "command"])),
});

export const DailyActivitySchema = z.object({
  date: z.string(), // YYYY-MM-DD in local timezone
  segments: z.array(ActivitySegmentSchema),
  estimatedActiveMinutes: z.number().nonnegative(),
  sessionCount: z.number().int().nonnegative(),
  completedWorkCycles: z.number().int().nonnegative(),
  completedBreakCycles: z.number().int().nonnegative(),
  reminderOutcomes: z.array(
    z.object({
      reminderId: z.string(),
      reminderText: z.string(),
      completed: z.boolean(),
      snoozedCount: z.number().int().nonnegative(),
      dismissedCount: z.number().int().nonnegative(),
    })
  ),
});

export const ActivityHistorySchema = z.object({
  version: z.literal(ACTIVITY_HISTORY_SCHEMA_VERSION),
  days: z.record(z.string(), DailyActivitySchema), // key: YYYY-MM-DD
});

export type ActivitySegment = z.infer<typeof ActivitySegmentSchema>;
export type DailyActivity = z.infer<typeof DailyActivitySchema>;
export type ActivityHistory = z.infer<typeof ActivityHistorySchema>;

export const EMPTY_ACTIVITY_HISTORY: ActivityHistory = {
  version: ACTIVITY_HISTORY_SCHEMA_VERSION,
  days: {},
};

// ============================================================================
// Well-being Runtime State Schema (globalState)
// ============================================================================

export const RoutineStateSchema = z.object({
  status: z.enum(["idle", "running", "paused", "finished"]),
  mode: z.enum(["work", "break", "longBreak"]),
  workDurationMinutes: z.number().int().positive(),
  breakDurationMinutes: z.number().int().positive(),
  longBreakDurationMinutes: z.number().int().positive(),
  cyclesUntilLongBreak: z.number().int().positive(),
  completedCycles: z.number().int().nonnegative(),
  startedAt: z.number().int().nonnegative().nullable(),
  pausedAt: z.number().int().nonnegative().nullable(),
  elapsedMs: z.number().int().nonnegative(),
  endsAt: z.number().int().nonnegative().nullable(),
});

export const ReminderStateSchema = z.object({
  id: z.string(),
  text: z.string(),
  intervalMinutes: z.number().int().positive(),
  enabled: z.boolean(),
  nextTriggerAt: z.number().int().nonnegative().nullable(),
  lastTriggeredAt: z.number().int().nonnegative().nullable(),
  snoozedUntil: z.number().int().nonnegative().nullable(),
  isOverdue: z.boolean(),
});

export const WellbeingRuntimeStateSchema = z.object({
  version: z.literal(WELLBEING_STATE_SCHEMA_VERSION),
  routine: RoutineStateSchema,
  reminders: z.array(ReminderStateSchema),
  trackingEnabled: z.boolean(),
  quietHours: QuietHoursSchema.nullable(),
});

export type RoutineState = z.infer<typeof RoutineStateSchema>;
export type ReminderState = z.infer<typeof ReminderStateSchema>;
export type WellbeingRuntimeState = z.infer<typeof WellbeingRuntimeStateSchema>;

export const DEFAULT_WELLBEING_RUNTIME_STATE: WellbeingRuntimeState = {
  version: WELLBEING_STATE_SCHEMA_VERSION,
  routine: {
    status: "idle",
    mode: "work",
    workDurationMinutes: 25,
    breakDurationMinutes: 5,
    longBreakDurationMinutes: 15,
    cyclesUntilLongBreak: 4,
    completedCycles: 0,
    startedAt: null,
    pausedAt: null,
    elapsedMs: 0,
    endsAt: null,
  },
  reminders: [],
  trackingEnabled: false,
  quietHours: null,
};

// ============================================================================
// Repository Rules Schema (workspaceState + optional project config)
// ============================================================================

export const RepositoryRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  pattern: z.string().min(1),
  condition: z
    .object({
      type: z.enum(["extension", "directory", "name-pattern"]),
      value: z.string(),
    })
    .optional(),
  description: z.string().max(500),
  severity: z.enum(["info", "warning", "error"]),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export const RepositoryRulesSchema = z.object({
  version: z.number().int().positive().default(1),
  rules: z.array(RepositoryRuleSchema),
  inferredRules: z.array(RepositoryRuleSchema).default([]),
  dismissedDiagnostics: z.array(z.string()).default([]),
});

export type RepositoryRule = z.infer<typeof RepositoryRuleSchema>;
export type RepositoryRulesState = z.infer<typeof RepositoryRulesSchema>;

export const DEFAULT_REPOSITORY_RULES_STATE: RepositoryRulesState = {
  version: 1,
  rules: [],
  inferredRules: [],
  dismissedDiagnostics: [],
};

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  // globalState keys
  WELLBEING_RUNTIME: "wellbeing.runtime",
  WELLBEING_SETTINGS: "wellbeing.settings", // deprecated - use VS Code config
  REPOSITORY_RULES_PREFIX: "repository.rules.", // + workspace hash

  // globalStorageUri files
  ACTIVITY_HISTORY: "activity-history.json",
  WELLBEING_REPORTS: "wellbeing-reports.json",
} as const;

// ============================================================================
// Migration Functions
// ============================================================================

export function migrateActivityHistory(
  data: unknown,
  fromVersion: number
): ActivityHistory {
  if (fromVersion === ACTIVITY_HISTORY_SCHEMA_VERSION) {
    return ActivityHistorySchema.parse(data);
  }
  // Future migrations would go here
  console.warn(
    `[Storage] Unknown activity history version ${fromVersion}, using empty history`
  );
  return EMPTY_ACTIVITY_HISTORY;
}

export function migrateWellbeingRuntimeState(
  data: unknown,
  fromVersion: number
): WellbeingRuntimeState {
  if (fromVersion === WELLBEING_STATE_SCHEMA_VERSION) {
    return WellbeingRuntimeStateSchema.parse(data);
  }
  console.warn(
    `[Storage] Unknown wellbeing state version ${fromVersion}, using defaults`
  );
  return DEFAULT_WELLBEING_RUNTIME_STATE;
}

export function migrateRepositoryRules(
  data: unknown,
  fromVersion: number
): RepositoryRulesState {
  if (fromVersion === 1) {
    return RepositoryRulesSchema.parse(data);
  }
  console.warn(
    `[Storage] Unknown repository rules version ${fromVersion}, using defaults`
  );
  return DEFAULT_REPOSITORY_RULES_STATE;
}

// ============================================================================
// Typed Storage Adapters
// ============================================================================

/**
 * Typed wrapper for VS Code globalState (extension-global preferences)
 */
export class GlobalStateStore {
  constructor(
    private readonly globalState: vscode.Memento,
    private readonly eventBus?: { emit: (event: string, payload: unknown) => void }
  ) {}

  /**
   * Get a typed value with default
   */
  get<T>(key: string, defaultValue: T): T {
    return this.globalState.get<T>(key) ?? defaultValue;
  }

  /**
   * Get with Zod schema validation
   */
  getWithSchema<T>(key: string, schema: z.ZodSchema<T>, defaultValue: T): T {
    const raw = this.globalState.get<unknown>(key);
    if (raw === undefined) {
      return defaultValue;
    }
    const result = schema.safeParse(raw);
    if (!result.success) {
      console.warn(`[Storage] Invalid data for key ${key}:`, result.error);
      return defaultValue;
    }
    return result.data;
  }

  /**
   * Update a value
   */
  async set<T>(key: string, value: T): Promise<void> {
    await this.globalState.update(key, value);
    this.eventBus?.emit(`storage:changed:${key}`, { key, value });
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    await this.globalState.update(key, undefined);
    this.eventBus?.emit(`storage:deleted:${key}`, { key });
  }

  /**
   * Get wellbeing runtime state with migration
   */
  getWellbeingRuntimeState(): WellbeingRuntimeState {
    return this.getWithSchema(
      STORAGE_KEYS.WELLBEING_RUNTIME,
      WellbeingRuntimeStateSchema,
      DEFAULT_WELLBEING_RUNTIME_STATE
    );
  }

  /**
   * Set wellbeing runtime state
   */
  async setWellbeingRuntimeState(state: WellbeingRuntimeState): Promise<void> {
    await this.set(STORAGE_KEYS.WELLBEING_RUNTIME, state);
  }

  /**
   * Get repository rules for a workspace
   */
  getRepositoryRules(workspaceHash: string): RepositoryRulesState {
    return this.getWithSchema(
      `${STORAGE_KEYS.REPOSITORY_RULES_PREFIX}${workspaceHash}`,
      RepositoryRulesSchema,
      DEFAULT_REPOSITORY_RULES_STATE
    );
  }

  /**
   * Set repository rules for a workspace
   */
  async setRepositoryRules(
    workspaceHash: string,
    state: RepositoryRulesState
  ): Promise<void> {
    await this.set(
      `${STORAGE_KEYS.REPOSITORY_RULES_PREFIX}${workspaceHash}`,
      state
    );
  }
}

/**
 * Typed wrapper for VS Code workspaceState (workspace-scoped transient)
 */
export class WorkspaceStateStore {
  constructor(
    private readonly workspaceState: vscode.Memento,
    private readonly eventBus?: { emit: (event: string, payload: unknown) => void }
  ) {}

  get<T>(key: string, defaultValue: T): T {
    return this.workspaceState.get<T>(key) ?? defaultValue;
  }

  getWithSchema<T>(key: string, schema: z.ZodSchema<T>, defaultValue: T): T {
    const raw = this.workspaceState.get<unknown>(key);
    if (raw === undefined) {
      return defaultValue;
    }
    const result = schema.safeParse(raw);
    if (!result.success) {
      console.warn(`[WorkspaceStorage] Invalid data for key ${key}:`, result.error);
      return defaultValue;
    }
    return result.data;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.workspaceState.update(key, value);
    this.eventBus?.emit(`workspaceStorage:changed:${key}`, { key, value });
  }

  async delete(key: string): Promise<void> {
    await this.workspaceState.update(key, undefined);
    this.eventBus?.emit(`workspaceStorage:deleted:${key}`, { key });
  }
}

/**
 * Typed wrapper for VS Code globalStorageUri (large local files)
 */
export class GlobalFileStore {
  constructor(private readonly globalStorageUri: vscode.Uri) {}

  private async ensureDirectory(): Promise<void> {
    try {
      await vscode.workspace.fs.stat(this.globalStorageUri);
    } catch {
      await vscode.workspace.fs.createDirectory(this.globalStorageUri);
    }
  }

  private fileUri(path: string): vscode.Uri {
    return vscode.Uri.joinPath(this.globalStorageUri, path);
  }

  /**
   * Read and parse JSON file with schema validation and migration
   */
  async readJson<T>(
    path: string,
    schema: z.ZodSchema<T>,
    migrate: (data: unknown, version: number) => T
  ): Promise<T> {
    await this.ensureDirectory();
    const uri = this.fileUri(path);
    try {
      const data = await vscode.workspace.fs.readFile(uri);
      const parsed = JSON.parse(new TextDecoder().decode(data));
      const version = parsed.version ?? 0;
      return migrate(parsed, version);
    } catch (error) {
      if (
        error instanceof Error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        // File doesn't exist, return default by parsing empty object
        return migrate({}, 0);
      }
      console.error(`[GlobalFileStore] Failed to read ${path}:`, error);
      return migrate({}, 0);
    }
  }

  /**
   * Write JSON file atomically
   */
  async writeJson<T>(path: string, data: T): Promise<void> {
    await this.ensureDirectory();
    const uri = this.fileUri(path);
    const json = JSON.stringify(data, null, 2);
    // Write to temp file then rename for atomicity
    const tempUri = vscode.Uri.joinPath(
      this.globalStorageUri,
      `.${path}.tmp`
    );
    await vscode.workspace.fs.writeFile(
      tempUri,
      new TextEncoder().encode(json)
    );
    await vscode.workspace.fs.rename(tempUri, uri, { overwrite: true });
  }

  /**
   * Delete a file
   */
  async delete(path: string): Promise<void> {
    const uri = this.fileUri(path);
    try {
      await vscode.workspace.fs.delete(uri);
    } catch {
      // Ignore if not exists
    }
  }

  /**
   * List all files
   */
  async list(): Promise<string[]> {
    await this.ensureDirectory();
    try {
      const entries = await vscode.workspace.fs.readDirectory(
        this.globalStorageUri
      );
      return entries
        .filter(([, type]) => type === vscode.FileType.File)
        .map(([name]) => name);
    } catch {
      return [];
    }
  }

  /**
   * Get activity history with migration
   */
  async getActivityHistory(): Promise<ActivityHistory> {
    return this.readJson(
      STORAGE_KEYS.ACTIVITY_HISTORY,
      ActivityHistorySchema,
      migrateActivityHistory
    );
  }

  /**
   * Set activity history
   */
  async setActivityHistory(history: ActivityHistory): Promise<void> {
    await this.writeJson(STORAGE_KEYS.ACTIVITY_HISTORY, history);
  }

  /**
   * Apply retention policy - remove entries older than retentionDays
   */
  async applyRetentionPolicy(retentionDays: number): Promise<number> {
    const history = await this.getActivityHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffStr = cutoffDate.toISOString().split("T")[0]; // YYYY-MM-DD

    const originalCount = Object.keys(history.days).length;
    const filteredDays: Record<string, DailyActivity> = {};

    for (const [date, day] of Object.entries(history.days)) {
      if (date >= cutoffStr) {
        filteredDays[date] = day;
      }
    }

    const removedCount = originalCount - Object.keys(filteredDays).length;

    if (removedCount > 0) {
      await this.setActivityHistory({
        ...history,
        days: filteredDays,
      });
      console.log(
        `[GlobalFileStore] Retention policy: removed ${removedCount} days older than ${retentionDays} days`
      );
    }

    return removedCount;
  }
}

/**
 * Typed wrapper for VS Code SecretStorage (credentials)
 */
export class SecretStore {
  constructor(private readonly secrets: vscode.SecretStorage) {}

  async get(key: string): Promise<string | undefined> {
    return this.secrets.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.secrets.store(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.secrets.delete(key);
  }
}

/**
 * Typed wrapper for VS Code Configuration (user/workspace settings)
 */
export class ConfigurationStore {
  private readonly config: vscode.WorkspaceConfiguration;

  constructor(section: string = "droidCompanion") {
    this.config = vscode.workspace.getConfiguration(section);
  }

  get<T>(key: string, defaultValue: T): T {
    return this.config.get<T>(key) ?? defaultValue;
  }

  getWithSchema<T>(key: string, schema: z.ZodSchema<T>, defaultValue: T): T {
    const raw = this.config.get<unknown>(key);
    if (raw === undefined) {
      return defaultValue;
    }
    const result = schema.safeParse(raw);
    if (!result.success) {
      console.warn(
        `[Config] Invalid setting ${key}:`,
        result.error
      );
      return defaultValue;
    }
    return result.data;
  }

  async set<T>(
    key: string,
    value: T,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    await this.config.update(key, value, target);
  }

  async delete(
    key: string,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    await this.config.update(key, undefined, target);
  }

  onDidChange(
    listener: (e: vscode.ConfigurationChangeEvent) => void
  ): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("droidCompanion")) {
        listener(e);
      }
    });
  }

  // Convenience getters for wellbeing settings
  getWellbeingSettings(): WellbeingSettings {
    return this.getWithSchema(
      "wellbeing",
      WellbeingSettingsSchema,
      DEFAULT_WELLBEING_SETTINGS
    );
  }

  getTelemetryEnabled(): boolean {
    return this.get<boolean>("telemetry.enabled", false);
  }

  getRetentionDays(): number {
    return this.get<number>("retention.activityHistoryDays", 90);
  }
}

// ============================================================================
// Composite Storage Manager
// ============================================================================

export interface StorageManager {
  readonly globalState: GlobalStateStore;
  readonly workspaceState: WorkspaceStateStore;
  readonly globalFiles: GlobalFileStore;
  readonly secrets: SecretStore;
  readonly config: ConfigurationStore;

  // Convenience methods
  getWellbeingRuntimeState(): WellbeingRuntimeState;
  setWellbeingRuntimeState(state: WellbeingRuntimeState): Promise<void>;
  getActivityHistory(): Promise<ActivityHistory>;
  setActivityHistory(history: ActivityHistory): Promise<void>;
  applyRetentionPolicy(): Promise<number>;
  getRepositoryRules(workspaceHash: string): RepositoryRulesState;
  setRepositoryRules(
    workspaceHash: string,
    state: RepositoryRulesState
  ): Promise<void>;
}

export function createStorageManager(
  context: vscode.ExtensionContext,
  eventBus?: { emit: (event: string, payload: unknown) => void }
): StorageManager {
  const globalState = new GlobalStateStore(context.globalState, eventBus);
  const workspaceState = new WorkspaceStateStore(
    context.workspaceState,
    eventBus
  );
  const globalFiles = new GlobalFileStore(context.globalStorageUri);
  const secrets = new SecretStore(context.secrets);
  const config = new ConfigurationStore();

  return {
    globalState,
    workspaceState,
    globalFiles,
    secrets,
    config,

    // Convenience delegation
    getWellbeingRuntimeState: () => globalState.getWellbeingRuntimeState(),
    setWellbeingRuntimeState: (state) =>
      globalState.setWellbeingRuntimeState(state),
    getActivityHistory: () => globalFiles.getActivityHistory(),
    setActivityHistory: (history) => globalFiles.setActivityHistory(history),
    applyRetentionPolicy: () =>
      globalFiles.applyRetentionPolicy(config.getRetentionDays()),
    getRepositoryRules: (hash) => globalState.getRepositoryRules(hash),
    setRepositoryRules: (hash, state) =>
      globalState.setRepositoryRules(hash, state),
  };
}