/**
 * Droid Companion - Extension Entry Point
 * Composition root: activates features and registers providers/commands.
 */

import * as vscode from "vscode";
import { createWebviewProvider } from "./companion/webview-provider";
import { eventBus } from "./core/event-bus";
import { createPlatformAdapter } from "./platform/vscode";
import { createStorageManager } from "./platform/storage";
import { initializeWellbeing } from "./features/wellbeing/index";
import { initializeRepository } from "./features/repository/index";
import { initializeTelemetry } from "./features/telemetry/index";

export function activate(context: vscode.ExtensionContext): void {
  console.log("[DroidCompanion] Activating extension...");

  const platform = createPlatformAdapter(context);
  const storage = createStorageManager(context, eventBus);
  const disposables: vscode.Disposable[] = [];

  // Apply retention policy on activation
  storage.applyRetentionPolicy().catch((err) => {
    console.error("[DroidCompanion] Retention policy failed:", err);
  });

  // Register webview view provider
  const webviewProvider = createWebviewProvider(context.extensionUri);
  disposables.push(
    platform.window.registerWebviewViewProvider("droidCompanion", webviewProvider)
  );

  // ========================================================================
  // Command Registration
  // All commands declared in package.json must be registered here
  // ========================================================================

  // General
  disposables.push(
    platform.commands.registerCommand("droidCompanion.helloWorld", () => {
      platform.window.showInformationMessage("Hello from Droid Companion!");
    })
  );

  // Well-being commands
  disposables.push(
    platform.commands.registerCommand("droidCompanion.startRoutine", () => {
      console.log("[Wellbeing] Start routine command");
      // TODO: Delegate to wellbeing feature
    })
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.pauseRoutine", () => {
      console.log("[Wellbeing] Pause routine command");
    })
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.resumeRoutine", () => {
      console.log("[Wellbeing] Resume routine command");
    })
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.finishRoutine", () => {
      console.log("[Wellbeing] Finish routine command");
    })
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.resetRoutine", () => {
      console.log("[Wellbeing] Reset routine command");
    })
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.snoozeReminder", (...args: unknown[]) => {
      const [reminderId, minutes] = args as [string | undefined, number | undefined];
      console.log("[Wellbeing] Snooze reminder:", reminderId, minutes);
    })
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.dismissReminder", (...args: unknown[]) => {
      const [reminderId] = args as [string | undefined];
      console.log("[Wellbeing] Dismiss reminder:", reminderId);
    })
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.toggleTracking", () => {
      console.log("[Wellbeing] Toggle tracking command");
    })
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.openWellbeingSettings", () => {
      platform.commands.executeCommand("workbench.action.openSettings", "droidCompanion.wellbeing");
    })
  );

  // Repository commands
  disposables.push(
    platform.commands.registerCommand("droidCompanion.scanProject", () => {
      console.log("[Repository] Scan project command");
    })
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.cleanupPreview", () => {
      console.log("[Repository] Cleanup preview command");
    })
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.confirmCleanup", () => {
      console.log("[Repository] Confirm cleanup command");
    })
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.openRepositoryRules", () => {
      console.log("[Repository] Open repository rules");
    })
  );

  // View/UI commands
  disposables.push(
    platform.commands.registerCommand("droidCompanion.focusView", () => {
      platform.commands.executeCommand("droidCompanion.focus");
    })
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.openActionWheel", () => {
      // Webview will handle this via message
      webviewProvider.sendMessage({
        version: 1,
        type: "stateUpdate",
        direction: "extension-to-webview",
        state: {},
      });
    })
  );

  // Initialize features with platform and storage
  const wellbeingDisposables = initializeWellbeing(platform, webviewProvider, storage);
  const repositoryDisposables = initializeRepository(platform, webviewProvider, storage);
  const telemetryDisposables = initializeTelemetry(platform, storage);

  disposables.push(
    ...wellbeingDisposables,
    ...repositoryDisposables,
    ...telemetryDisposables
  );

  // Handle VS Code telemetry changes
  disposables.push(
    platform.telemetry.onDidChangeTelemetryEnabled((enabled) => {
      eventBus.emit("telemetry:enabledChanged", enabled);
    })
  );

  // Register all disposables with VS Code
  for (const d of disposables) {
    context.subscriptions.push(d);
  }

  console.log("[DroidCompanion] Extension activated");
}

export function deactivate(): void {
  console.log("[DroidCompanion] Deactivating extension...");
  // Clear event bus to prevent memory leaks
  eventBus.clear();
  console.log("[DroidCompanion] Extension deactivated");
}