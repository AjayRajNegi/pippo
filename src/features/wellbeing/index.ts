/**
 * Well-being feature initialization.
 * Provides routine scheduling, reminders, activity tracking, and reports.
 */

import type * as vscode from "vscode";
import type { WebviewViewProvider } from "../../companion/webview-provider";
import { eventBus } from "../../core/event-bus";
import type { IncomingMessage } from "../../core/messages";
import type { PlatformAdapter } from "../../platform/vscode";

export function initializeWellbeing(
  platform: PlatformAdapter,
  webview: WebviewViewProvider,
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  // Register well-being commands
  disposables.push(
    platform.commands.registerCommand("droidCompanion.startRoutine", () => {
      console.log("[Wellbeing] Start routine command");
    }),
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.pauseRoutine", () => {
      console.log("[Wellbeing] Pause routine command");
    }),
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.resetRoutine", () => {
      console.log("[Wellbeing] Reset routine command");
    }),
  );

  // Listen for webview messages related to well-being
  disposables.push(
    eventBus.on<IncomingMessage>("webview:message", (msg) => {
      if (
        msg.type.startsWith("routine") ||
        msg.type.startsWith("reminder") ||
        msg.type === "toggleTracking"
      ) {
        console.log("[Wellbeing] Received message:", msg.type);
        // TODO: Handle well-being messages
      }
    }),
  );

  // Send initial well-being state to webview (placeholder)
  const initialRoutineState = {
    status: "idle" as const,
    mode: "work" as const,
    workDurationMinutes: 25,
    breakDurationMinutes: 5,
    longBreakDurationMinutes: 15,
    cyclesUntilLongBreak: 4,
    completedCycles: 0,
    startedAt: null,
    pausedAt: null,
    elapsedMs: 0,
    endsAt: null,
  };

  webview.setRoutineState?.(initialRoutineState);
  webview.setReminders?.([]);
  webview.setTrackingEnabled?.(false);
  webview.setQuietHours?.(null);

  console.log("[Wellbeing] Feature initialized (stub)");

  return disposables;
}
