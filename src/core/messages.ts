/**
 * Core message protocol for webview <-> extension host communication.
 * All messages are versioned and validated at runtime using Zod.
 */

import { z } from "zod";

// Version of the message protocol. Increment when making breaking changes.
export const MESSAGE_PROTOCOL_VERSION = 1;

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

// Base schema
const BaseMessageSchema = z.object({
	version: z.literal(MESSAGE_PROTOCOL_VERSION),
	type: z.string(),
	requestId: z.string().optional(),
});

// Direction discriminators
const WebviewToExtensionDirection = z.literal("webview-to-extension");
const ExtensionToWebviewDirection = z.literal("extension-to-webview");

// Webview -> Extension host messages (user intents)
const OpenFeatureMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("openFeature"),
	feature: z.enum([
		"routine",
		"reminders",
		"reports",
		"projectScan",
		"cleanup",
		"rules",
	]),
});

const RoutineActionMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("routineAction"),
	action: z.enum(["start", "pause", "resume", "finish", "reset"]),
});

const ReminderActionMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("reminderAction"),
	reminderId: z.string(),
	action: z.enum([
		"snooze",
		"dismiss",
		"markDone",
		"pause",
		"enable",
		"disable",
	]),
	snoozeMinutes: z.number().int().positive().optional(),
});

const CreateReminderMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("createReminder"),
	text: z.string().min(1).max(500),
	intervalMinutes: z.number().int().positive(),
});

const UpdateReminderMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("updateReminder"),
	reminderId: z.string(),
	text: z.string().min(1).max(500).optional(),
	intervalMinutes: z.number().int().positive().optional(),
	enabled: z.boolean().optional(),
});

const DeleteReminderMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("deleteReminder"),
	reminderId: z.string(),
});

const ToggleTrackingMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("toggleTracking"),
	enabled: z.boolean(),
});

const RequestScanMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("requestScan"),
});

const RequestCleanupPreviewMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("requestCleanupPreview"),
});

const ConfirmCleanupMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("confirmCleanup"),
	targets: z.array(z.string()).min(1),
});

const CreateRuleMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("createRule"),
	rule: z.object({
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
	}),
});

const UpdateRuleMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("updateRule"),
	ruleId: z.string(),
	rule: z
		.object({
			name: z.string().min(1).max(100).optional(),
			pattern: z.string().min(1).optional(),
			condition: z
				.object({
					type: z.enum(["extension", "directory", "name-pattern"]),
					value: z.string(),
				})
				.optional(),
			description: z.string().max(500).optional(),
			severity: z.enum(["info", "warning", "error"]).optional(),
			updatedAt: z.number().int().positive().optional(),
		})
		.partial(),
});

const DeleteRuleMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("deleteRule"),
	ruleId: z.string(),
});

const InferRulesMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("inferRules"),
});

const ClearHistoryMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("clearHistory"),
	confirm: z.boolean(),
});

const GetStateMessageSchema = BaseMessageSchema.extend({
	direction: WebviewToExtensionDirection,
	type: z.literal("getState"),
});

// Extension -> Webview messages (display state, updates)
const InitialStateMessageSchema = BaseMessageSchema.extend({
	direction: ExtensionToWebviewDirection,
	type: z.literal("initialState"),
	state: z.object({
		routine: z.object({
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
		}),
		reminders: z.array(
			z.object({
				id: z.string(),
				text: z.string(),
				intervalMinutes: z.number().int().positive(),
				enabled: z.boolean(),
				nextTriggerAt: z.number().int().nonnegative().nullable(),
				lastTriggeredAt: z.number().int().nonnegative().nullable(),
				snoozedUntil: z.number().int().nonnegative().nullable(),
				isOverdue: z.boolean(),
			}),
		),
		trackingEnabled: z.boolean(),
		quietHours: z
			.object({
				startHour: z.number().int().min(0).max(23),
				startMinute: z.number().int().min(0).max(59),
				endHour: z.number().int().min(0).max(23),
				endMinute: z.number().int().min(0).max(59),
				timezone: z.string(),
			})
			.nullable(),
	}),
});

const StateUpdateMessageSchema = BaseMessageSchema.extend({
	direction: ExtensionToWebviewDirection,
	type: z.literal("stateUpdate"),
	state: z.object({
		routine: z
			.object({
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
			})
			.optional(),
		reminders: z
			.array(
				z.object({
					id: z.string(),
					text: z.string(),
					intervalMinutes: z.number().int().positive(),
					enabled: z.boolean(),
					nextTriggerAt: z.number().int().nonnegative().nullable(),
					lastTriggeredAt: z.number().int().nonnegative().nullable(),
					snoozedUntil: z.number().int().nonnegative().nullable(),
					isOverdue: z.boolean(),
				}),
			)
			.optional(),
		trackingEnabled: z.boolean().optional(),
		quietHours: z
			.object({
				startHour: z.number().int().min(0).max(23),
				startMinute: z.number().int().min(0).max(59),
				endHour: z.number().int().min(0).max(23),
				endMinute: z.number().int().min(0).max(59),
				timezone: z.string(),
			})
			.nullable()
			.optional(),
	}),
});

const RoutineStateMessageSchema = BaseMessageSchema.extend({
	direction: ExtensionToWebviewDirection,
	type: z.literal("routineState"),
	routine: z.object({
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
	}),
});

const ReminderUpdateMessageSchema = BaseMessageSchema.extend({
	direction: ExtensionToWebviewDirection,
	type: z.literal("reminderUpdate"),
	reminders: z.array(
		z.object({
			id: z.string(),
			text: z.string(),
			intervalMinutes: z.number().int().positive(),
			enabled: z.boolean(),
			nextTriggerAt: z.number().int().nonnegative().nullable(),
			lastTriggeredAt: z.number().int().nonnegative().nullable(),
			snoozedUntil: z.number().int().nonnegative().nullable(),
			isOverdue: z.boolean(),
		}),
	),
	triggered: z.array(z.string()).optional(),
});

const ReportDataMessageSchema = BaseMessageSchema.extend({
	direction: ExtensionToWebviewDirection,
	type: z.literal("reportData"),
	daily: z
		.object({
			date: z.string(),
			estimatedActiveMinutes: z.number().int().nonnegative(),
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
				}),
			),
		})
		.nullable(),
	weekly: z
		.object({
			weekStart: z.string(),
			dailyBreakdown: z.array(
				z.object({
					date: z.string(),
					estimatedActiveMinutes: z.number().int().nonnegative(),
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
						}),
					),
				}),
			),
			totalActiveMinutes: z.number().int().nonnegative(),
			averageDailyMinutes: z.number().nonnegative(),
			totalWorkCycles: z.number().int().nonnegative(),
			totalBreakCycles: z.number().int().nonnegative(),
			trend: z.enum(["up", "down", "stable", "insufficient-data"]),
		})
		.nullable(),
});

const ScanResultMessageSchema = BaseMessageSchema.extend({
	direction: ExtensionToWebviewDirection,
	type: z.literal("scanResult"),
	tree: z.object({
		name: z.string(),
		path: z.string(),
		type: z.enum(["file", "directory"]),
		children: z
			.array(
				z.object({
					name: z.string(),
					path: z.string(),
					type: z.enum(["file", "directory"]),
					children: z.array(z.unknown()).optional(),
					isExcluded: z.boolean().optional(),
					diagnosticCount: z.number().int().nonnegative().optional(),
				}),
			)
			.optional(),
		isExcluded: z.boolean().optional(),
		diagnosticCount: z.number().int().nonnegative().optional(),
	}),
	diagnostics: z.array(
		z.object({
			id: z.string(),
			category: z.enum([
				"generated",
				"missing-ignore",
				"config-contradiction",
				"info",
			]),
			severity: z.enum(["info", "warning", "error"]),
			message: z.string(),
			evidencePath: z.string().optional(),
			suggestedAction: z.string().optional(),
			dismissible: z.boolean(),
		}),
	),
});

const CleanupPreviewMessageSchema = BaseMessageSchema.extend({
	direction: ExtensionToWebviewDirection,
	type: z.literal("cleanupPreview"),
	targets: z.array(
		z.object({
			path: z.string(),
			name: z.string(),
			estimatedSizeBytes: z.number().int().nonnegative().nullable(),
			type: z.enum(["generated", "dependencies"]),
		}),
	),
});

const CleanupResultMessageSchema = BaseMessageSchema.extend({
	direction: ExtensionToWebviewDirection,
	type: z.literal("cleanupResult"),
	results: z.array(
		z.object({
			path: z.string(),
			success: z.boolean(),
			error: z.string().optional(),
			skipped: z.boolean().optional(),
			skipReason: z.string().optional(),
		}),
	),
});

const RulesListMessageSchema = BaseMessageSchema.extend({
	direction: ExtensionToWebviewDirection,
	type: z.literal("rulesList"),
	rules: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			pattern: z.string(),
			condition: z
				.object({
					type: z.enum(["extension", "directory", "name-pattern"]),
					value: z.string(),
				})
				.optional(),
			description: z.string(),
			severity: z.enum(["info", "warning", "error"]),
			createdAt: z.number().int().positive(),
			updatedAt: z.number().int().positive(),
			violations: z.array(
				z.object({
					filePath: z.string(),
					message: z.string(),
					suggestedFix: z.string().optional(),
				}),
			),
		}),
	),
});

const InferredRulesMessageSchema = BaseMessageSchema.extend({
	direction: ExtensionToWebviewDirection,
	type: z.literal("inferredRules"),
	rules: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			pattern: z.string(),
			condition: z
				.object({
					type: z.enum(["extension", "directory", "name-pattern"]),
					value: z.string(),
				})
				.optional(),
			description: z.string(),
			severity: z.enum(["info", "warning", "error"]),
			createdAt: z.number().int().positive(),
			updatedAt: z.number().int().positive(),
		}),
	),
});

const ErrorMessageSchema = BaseMessageSchema.extend({
	direction: ExtensionToWebviewDirection,
	type: z.literal("error"),
	code: z.string(),
	message: z.string(),
});

const LogMessageSchema = BaseMessageSchema.extend({
	direction: ExtensionToWebviewDirection,
	type: z.literal("log"),
	level: z.enum(["info", "warn", "error"]),
	message: z.string(),
});

// Union schemas for validation
export const IncomingMessageSchema = z.discriminatedUnion("type", [
	OpenFeatureMessageSchema,
	RoutineActionMessageSchema,
	ReminderActionMessageSchema,
	CreateReminderMessageSchema,
	UpdateReminderMessageSchema,
	DeleteReminderMessageSchema,
	ToggleTrackingMessageSchema,
	RequestScanMessageSchema,
	RequestCleanupPreviewMessageSchema,
	ConfirmCleanupMessageSchema,
	CreateRuleMessageSchema,
	UpdateRuleMessageSchema,
	DeleteRuleMessageSchema,
	InferRulesMessageSchema,
	ClearHistoryMessageSchema,
	GetStateMessageSchema,
]);

export const OutgoingMessageSchema = z.discriminatedUnion("type", [
	InitialStateMessageSchema,
	StateUpdateMessageSchema,
	RoutineStateMessageSchema,
	ReminderUpdateMessageSchema,
	ReportDataMessageSchema,
	ScanResultMessageSchema,
	CleanupPreviewMessageSchema,
	CleanupResultMessageSchema,
	RulesListMessageSchema,
	InferredRulesMessageSchema,
	ErrorMessageSchema,
	LogMessageSchema,
]);

// ============================================================================
// TypeScript Types (inferred from Zod schemas)
// ============================================================================

export type IncomingMessage = z.infer<typeof IncomingMessageSchema>;
export type OutgoingMessage = z.infer<typeof OutgoingMessageSchema>;

// State types
export type ExtensionState = z.infer<typeof InitialStateMessageSchema>["state"];
export type RoutineState = z.infer<typeof RoutineStateMessageSchema>["routine"];
export type ReminderState = z.infer<
	typeof ReminderUpdateMessageSchema
>["reminders"][number];
export type QuietHours = ExtensionState["quietHours"];

export type DailyReport = z.infer<typeof ReportDataMessageSchema>["daily"];
export type WeeklyReport = z.infer<typeof ReportDataMessageSchema>["weekly"];

export type ReminderOutcome = NonNullable<DailyReport>["reminderOutcomes"][number];

export type ProjectTreeNode = z.infer<typeof ScanResultMessageSchema>["tree"];
export type Diagnostic = z.infer<
	typeof ScanResultMessageSchema
>["diagnostics"][number];
export type CleanupTarget = z.infer<
	typeof CleanupPreviewMessageSchema
>["targets"][number];
export type CleanupResult = z.infer<
	typeof CleanupResultMessageSchema
>["results"][number];

export type RuleDefinition = z.infer<typeof CreateRuleMessageSchema>["rule"];
export type RuleCondition = RuleDefinition["condition"];
export type RuleState = z.infer<typeof RulesListMessageSchema>["rules"][number];
export type RuleViolation = RuleState["violations"][number];

// Individual message types for external use
export type InitialStateMessage = z.infer<typeof InitialStateMessageSchema>;
export type StateUpdateMessage = z.infer<typeof StateUpdateMessageSchema>;
export type RoutineStateMessage = z.infer<typeof RoutineStateMessageSchema>;
export type ReminderUpdateMessage = z.infer<typeof ReminderUpdateMessageSchema>;
export type ReportDataMessage = z.infer<typeof ReportDataMessageSchema>;
export type ScanResultMessage = z.infer<typeof ScanResultMessageSchema>;
export type CleanupPreviewMessage = z.infer<typeof CleanupPreviewMessageSchema>;
export type CleanupResultMessage = z.infer<typeof CleanupResultMessageSchema>;
export type RulesListMessage = z.infer<typeof RulesListMessageSchema>;
export type InferredRulesMessage = z.infer<typeof InferredRulesMessageSchema>;
export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;
export type LogMessage = z.infer<typeof LogMessageSchema>;

// ============================================================================
// Validation Functions
// ============================================================================

export function validateIncomingMessage(msg: unknown): IncomingMessage {
	return IncomingMessageSchema.parse(msg);
}

export function validateOutgoingMessage(msg: unknown): OutgoingMessage {
	return OutgoingMessageSchema.parse(msg);
}

export function safeValidateIncomingMessage(
	msg: unknown,
):
	| { success: true; data: IncomingMessage }
	| { success: false; error: z.ZodError } {
	const result = IncomingMessageSchema.safeParse(msg);
	if (result.success) {
		return { success: true, data: result.data };
	}
	return { success: false, error: result.error };
}

export function safeValidateOutgoingMessage(
	msg: unknown,
):
	| { success: true; data: OutgoingMessage }
	| { success: false; error: z.ZodError } {
	const result = OutgoingMessageSchema.safeParse(msg);
	if (result.success) {
		return { success: true, data: result.data };
	}
	return { success: false, error: result.error };
}