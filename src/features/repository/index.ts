/**
 * Repository feature initialization.
 * Provides project scanning, diagnostics, rules, and cleanup.
 */

import type * as vscode from "vscode";
import type { WebviewViewProvider } from "../../companion/webview-provider";
import { eventBus } from "../../core/event-bus";
import type { IncomingMessage } from "../../core/messages";
import type { PlatformAdapter } from "../../platform/vscode";

export function initializeRepository(
  platform: PlatformAdapter,
  webview: WebviewViewProvider,
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  // Register repository commands
  disposables.push(
    platform.commands.registerCommand("droidCompanion.scanProject", () => {
      console.log("[Repository] Scan project command");
    }),
  );

  disposables.push(
    platform.commands.registerCommand("droidCompanion.cleanupPreview", () => {
      console.log("[Repository] Cleanup preview command");
    }),
  );

  // Listen for webview messages related to repository
  disposables.push(
    eventBus.on<IncomingMessage>("webview:message", (msg) => {
      if (
        msg.type === "requestScan" ||
        msg.type === "requestCleanupPreview" ||
        msg.type === "confirmCleanup" ||
        msg.type === "createRule" ||
        msg.type === "updateRule" ||
        msg.type === "deleteRule" ||
        msg.type === "inferRules"
      ) {
        console.log("[Repository] Received message:", msg.type);
        // TODO: Handle repository messages
      }
    }),
  );

  console.log("[Repository] Feature initialized (stub)");

  return disposables;
}
