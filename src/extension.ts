/**
 * Droid Companion - Extension Entry Point
 * Composition root: activates features and registers providers/commands.
 */

import type * as vscode from "vscode";
import { createWebviewProvider } from "./companion/webview-provider";
import { eventBus } from "./core/event-bus";
import { initializeRepository } from "./features/repository/index";
import { initializeTelemetry } from "./features/telemetry/index";
// Feature initializers (to be implemented)
import { initializeWellbeing } from "./features/wellbeing/index";
import { createPlatformAdapter } from "./platform/vscode";

export function activate(context: vscode.ExtensionContext): void {
	console.log("[DroidCompanion] Activating extension...");

	const platform = createPlatformAdapter(context);
	const disposables: vscode.Disposable[] = [];

	// Register webview view provider
	const webviewProvider = createWebviewProvider(context.extensionUri);
	disposables.push(
		platform.window.registerWebviewViewProvider(
			"droidCompanion",
			webviewProvider,
		),
	);

	// Register commands
	disposables.push(
		platform.commands.registerCommand("droidCompanion.helloWorld", () => {
			platform.window.showInformationMessage("Hello from Droid Companion!");
		}),
	);

	// Initialize features
	const wellbeingDisposables = initializeWellbeing(platform, webviewProvider);
	const repositoryDisposables = initializeRepository(platform, webviewProvider);
	const telemetryDisposables = initializeTelemetry(platform);

	disposables.push(
		...wellbeingDisposables,
		...repositoryDisposables,
		...telemetryDisposables,
	);

	// Handle telemetry changes
	disposables.push(
		platform.telemetry.onDidChangeTelemetryEnabled((enabled) => {
			eventBus.emit("telemetry:enabledChanged", enabled);
		}),
	);

	// Add all disposables to context
	for (const d of disposables) {
		context.subscriptions.push(d);
	}

	console.log("[DroidCompanion] Extension activated");
}

export function deactivate(): void {
	console.log("[DroidCompanion] Deactivating extension...");
	eventBus.clear();
	console.log("[DroidCompanion] Extension deactivated");
}
