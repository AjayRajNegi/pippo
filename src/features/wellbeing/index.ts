/**
 * Well-being feature initialization.
 * Provides routine scheduling, reminders, activity tracking, and reports.
 */

import type * as vscode from "vscode";
import type { WebviewViewProvider } from "../../companion/webview-provider";
import { eventBus } from "../../core/event-bus";
import type { IncomingMessage } from "../../core/messages";
import type { PlatformAdapter } from "../../platform/vscode";
import type { StorageManager } from "../../platform/storage";

export function initializeWellbeing(
  platform: PlatformAdapter,
  webview: WebviewViewProvider,
  storage: StorageManager
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  // Load initial state from storage
  const runtimeState = storage.getWellbeingRuntimeState();
  webview.setRoutineState?.(runtimeState.routine);
  webview.setReminders?.(runtimeState.reminders);
  webview.setTrackingEnabled?.(runtimeState.trackingEnabled);
  webview.setQuietHours?.(runtimeState.quietHours);

  // Register well-being commands
  disposables.push(
    platform.commands.registerCommand("droidCompanion.startRoutine", async () => {
      console.log("[Wellbeing] Start routine command");
      // TODO: Implement routine start logic
    }),
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.pauseRoutine", async () => {
      console.log("[Wellbeing] Pause routine command");
    }),
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.resumeRoutine", async () => {
      console.log("[Wellbeing] Resume routine command");
    }),
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.finishRoutine", async () => {
      console.log("[Wellbeing] Finish routine command");
    }),
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.resetRoutine", async () => {
      console.log("[Wellbeing] Reset routine command");
    }),
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.snoozeReminder", async (...args: unknown[]) => {
      const [reminderId, minutes] = args as [string | undefined, number | undefined];
      console.log("[Wellbeing] Snooze reminder:", reminderId, minutes);
    }),
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.dismissReminder", async (...args: unknown[]) => {
      const [reminderId] = args as [string | undefined];
      console.log("[Wellbeing] Dismiss reminder:", reminderId);
    }),
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.toggleTracking", async () => {
      console.log("[Wellbeing] Toggle tracking command");
    }),
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.openWellbeingSettings", async () => {
      platform.commands.executeCommand("workbench.action.openSettings", "droidCompanion.wellbeing");
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

  console.log("[Wellbeing] Feature initialized (stub)");

  return disposables;
}