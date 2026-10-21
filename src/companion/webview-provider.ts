/**
 * Webview view provider for the Droid Companion.
 * Handles message validation and communication with the webview.
 */

import * as vscode from "vscode";
import { eventBus } from "../core/event-bus";
import {
  type CleanupResult,
  type CleanupTarget,
  type DailyReport,
  type Diagnostic,
  type ExtensionState,
  type IncomingMessage,
  type InitialStateMessage,
  MESSAGE_PROTOCOL_VERSION,
  type OutgoingMessage,
  type ProjectTreeNode,
  type QuietHours,
  type ReminderState,
  type RoutineState,
  type RuleDefinition,
  type RuleState,
  validateIncomingMessage,
  type WeeklyReport,
} from "../core/messages";

export interface WebviewViewProvider extends vscode.WebviewViewProvider {
  sendMessage(msg: OutgoingMessage): void;
  getState(): ExtensionState | null;
  setRoutineState(routine: RoutineState): void;
  setReminders(reminders: readonly ReminderState[]): void;
  setTrackingEnabled(enabled: boolean): void;
  setQuietHours(quietHours: QuietHours | null): void;
  sendRoutineState(routine: RoutineState): void;
  sendReminderUpdate(
    reminders: readonly ReminderState[],
    triggered?: readonly string[],
  ): void;
  sendReports(daily: DailyReport | null, weekly: WeeklyReport | null): void;
  sendScanResult(
    tree: ProjectTreeNode,
    diagnostics: readonly Diagnostic[],
  ): void;
  sendCleanupPreview(targets: readonly CleanupTarget[]): void;
  sendCleanupResult(results: readonly CleanupResult[]): void;
  sendRulesList(rules: readonly RuleState[]): void;
  sendInferredRules(rules: readonly RuleDefinition[]): void;
  sendError(code: string, message: string): void;
}

function getWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
): string {
  // In production, this would load the bundled React app
  // For now, return a minimal HTML that loads the webview script
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "out", "webview.js"),
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "out", "webview.css"),
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>Droid Companion</title>
</head>
<body>
  <div id="root"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
}

export function createWebviewProvider(
  extensionUri: vscode.Uri,
): WebviewViewProvider {
  let currentView: vscode.WebviewView | undefined;
  let currentState: ExtensionState | null = null;

  // Standalone sendMessage function that can be used by all internal functions
  function sendMessage(msg: OutgoingMessage): void {
    if (currentView) {
      currentView.webview.postMessage(msg);
    }
  }

  function sendInitialState(): void {
    if (!currentState) return;
    const msg: InitialStateMessage = {
      version: MESSAGE_PROTOCOL_VERSION,
      type: "initialState",
      direction: "extension-to-webview",
      state: currentState,
    };
    sendMessage(msg);
  }

  function handleIncomingMessage(msg: IncomingMessage): void {
    // Emit to event bus for feature handlers to process
    eventBus.emit("webview:message", msg);
  }

  // Allow updating state from feature modules
  function updateState(partial: Partial<ExtensionState>): void {
    if (currentState) {
      currentState = { ...currentState, ...partial };
    } else {
      currentState = partial as ExtensionState;
    }
    // Send state update to webview
    const msg: OutgoingMessage = {
      version: MESSAGE_PROTOCOL_VERSION,
      type: "stateUpdate",
      direction: "extension-to-webview",
      state: partial,
    };
    sendMessage(msg);
  }

  const setRoutineState = (routine: RoutineState) => updateState({ routine });
  const setReminders = (reminders: readonly ReminderState[]) =>
    updateState({ reminders });
  const setTrackingEnabled = (enabled: boolean) =>
    updateState({ trackingEnabled: enabled });
  const setQuietHours = (quietHours: QuietHours | null) =>
    updateState({ quietHours });

  const sendRoutineState = (routine: RoutineState) => {
    sendMessage({
      version: MESSAGE_PROTOCOL_VERSION,
      type: "routineState",
      direction: "extension-to-webview",
      routine,
    });
  };
  const sendReminderUpdate = (
    reminders: readonly ReminderState[],
    triggered?: readonly string[],
  ) => {
    sendMessage({
      version: MESSAGE_PROTOCOL_VERSION,
      type: "reminderUpdate",
      direction: "extension-to-webview",
      reminders,
      triggered,
    });
  };
  const sendReports = (
    daily: DailyReport | null,
    weekly: WeeklyReport | null,
  ) => {
    sendMessage({
      version: MESSAGE_PROTOCOL_VERSION,
      type: "reportData",
      direction: "extension-to-webview",
      daily,
      weekly,
    });
  };
  const sendScanResult = (
    tree: ProjectTreeNode,
    diagnostics: readonly Diagnostic[],
  ) => {
    sendMessage({
      version: MESSAGE_PROTOCOL_VERSION,
      type: "scanResult",
      direction: "extension-to-webview",
      tree,
      diagnostics,
    });
  };
  const sendCleanupPreview = (targets: readonly CleanupTarget[]) => {
    sendMessage({
      version: MESSAGE_PROTOCOL_VERSION,
      type: "cleanupPreview",
      direction: "extension-to-webview",
      targets,
    });
  };
  const sendCleanupResult = (results: readonly CleanupResult[]) => {
    sendMessage({
      version: MESSAGE_PROTOCOL_VERSION,
      type: "cleanupResult",
      direction: "extension-to-webview",
      results,
    });
  };
  const sendRulesList = (rules: readonly RuleState[]) => {
    sendMessage({
      version: MESSAGE_PROTOCOL_VERSION,
      type: "rulesList",
      direction: "extension-to-webview",
      rules,
    });
  };
  const sendInferredRules = (rules: readonly RuleDefinition[]) => {
    sendMessage({
      version: MESSAGE_PROTOCOL_VERSION,
      type: "inferredRules",
      direction: "extension-to-webview",
      rules,
    });
  };
  const sendError = (code: string, message: string) => {
    sendMessage({
      version: MESSAGE_PROTOCOL_VERSION,
      type: "error",
      direction: "extension-to-webview",
      code,
      message,
    });
  };

  const provider: WebviewViewProvider = {
    resolveWebviewView(webviewView: vscode.WebviewView): void {
      currentView = webviewView;

      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [extensionUri],
      };

      webviewView.webview.html = getWebviewHtml(
        webviewView.webview,
        extensionUri,
      );

      webviewView.webview.onDidReceiveMessage(
        (message: unknown) => {
          try {
            const validated = validateIncomingMessage(message);
            handleIncomingMessage(validated);
          } catch (error) {
            console.error("[WebviewProvider] Invalid message received:", error);
            sendMessage({
              version: MESSAGE_PROTOCOL_VERSION,
              type: "error",
              direction: "extension-to-webview",
              code: "INVALID_MESSAGE",
              message: error instanceof Error ? error.message : "Unknown error",
            });
          }
        },
        undefined,
        [],
      );

      // Send initial state when webview is ready
      if (currentState) {
        sendInitialState();
      }

      webviewView.onDidDispose(() => {
        currentView = undefined;
      });
    },

    sendMessage,
    getState(): ExtensionState | null {
      return currentState;
    },
    setRoutineState,
    setReminders,
    setTrackingEnabled,
    setQuietHours,
    sendRoutineState,
    sendReminderUpdate,
    sendReports,
    sendScanResult,
    sendCleanupPreview,
    sendCleanupResult,
    sendRulesList,
    sendInferredRules,
    sendError,
  };

  return provider;
}
