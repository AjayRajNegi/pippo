/**
 * Telemetry feature initialization.
 * Optional, consent-based product usage telemetry.
 */

import type * as vscode from "vscode";
import { eventBus } from "../../core/event-bus";
import type { PlatformAdapter } from "../../platform/vscode";

export function initializeTelemetry(
  platform: PlatformAdapter,
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  // Check telemetry consent
  const isEnabled = platform.configuration.get<boolean>(
    "droidCompanion.telemetry.enabled",
    false,
  );
  const vscodeTelemetryEnabled = platform.telemetry.isTelemetryEnabled;

  const canSendTelemetry = isEnabled && vscodeTelemetryEnabled;

  if (canSendTelemetry) {
    console.log("[Telemetry] Enabled");
    // TODO: Initialize telemetry transport
  } else {
    console.log(
      "[Telemetry] Disabled (user setting:",
      isEnabled,
      ", VS Code:",
      vscodeTelemetryEnabled,
      ")",
    );
  }

  // Listen for telemetry setting changes
  disposables.push(
    platform.configuration.onDidChange((e) => {
      if (e.affectsConfiguration("droidCompanion.telemetry.enabled")) {
        const newValue = platform.configuration.get<boolean>(
          "droidCompanion.telemetry.enabled",
          false,
        );
        console.log("[Telemetry] Setting changed:", newValue);
        // TODO: Handle telemetry enable/disable
      }
    }),
  );

  // Listen for VS Code telemetry changes
  disposables.push(
    eventBus.on<boolean>("telemetry:enabledChanged", (enabled) => {
      console.log("[Telemetry] VS Code telemetry changed:", enabled);
      // TODO: Handle VS Code telemetry change
    }),
  );

  return disposables;
}
