/**
 * Platform adapters for VS Code APIs.
 * Thin wrappers with no business logic.
 */

import * as vscode from "vscode";
import type { EventBus } from "../core/event-bus";
import { eventBus } from "../core/event-bus";

export interface StorageAdapter {
	get<T>(key: string, defaultValue: T): T;
	update(key: string, value: unknown): Promise<void>;
	delete(key: string): Promise<void>;
}

export interface WorkspaceStorageAdapter {
	get<T>(key: string, defaultValue: T): T;
	update(key: string, value: unknown): Promise<void>;
	delete(key: string): Promise<void>;
}

export interface GlobalStorageAdapter {
	readonly uri: vscode.Uri;
	readFile(path: string): Promise<Uint8Array>;
	writeFile(path: string, data: Uint8Array): Promise<void>;
	deleteFile(path: string): Promise<void>;
	listFiles(): Promise<string[]>;
}

export interface SecretStorageAdapter {
	get(key: string): Promise<string | undefined>;
	store(key: string, value: string): Promise<void>;
	delete(key: string): Promise<void>;
}

export interface ConfigurationAdapter {
	get<T>(section: string, defaultValue: T): T;
	update(
		section: string,
		value: unknown,
		configurationTarget?: vscode.ConfigurationTarget,
	): Promise<void>;
	onDidChange(
		listener: (e: vscode.ConfigurationChangeEvent) => void,
	): vscode.Disposable;
}

export interface WorkspaceAdapter {
	readonly workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined;
	getWorkspaceFolder(uri: vscode.Uri): vscode.WorkspaceFolder | undefined;
	onDidChangeWorkspaceFolders(
		listener: (e: vscode.WorkspaceFoldersChangeEvent) => void,
	): vscode.Disposable;
	fs: {
		readFile(uri: vscode.Uri): Promise<Uint8Array>;
		writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void>;
		delete(uri: vscode.Uri, options?: { recursive?: boolean }): Promise<void>;
		stat(uri: vscode.Uri): Promise<vscode.FileStat>;
		readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]>;
	};
}

export interface WindowAdapter {
	readonly activeTextEditor: vscode.TextEditor | undefined;
	showInformationMessage(message: string): Thenable<string | undefined>;
	showWarningMessage(message: string): Thenable<string | undefined>;
	showErrorMessage(message: string): Thenable<string | undefined>;
	showQuickPick(
		items: readonly string[],
		options?: { placeHolder?: string },
	): Thenable<string | undefined>;
	withProgress<R>(
		options: vscode.ProgressOptions,
		task: (progress: vscode.Progress<{ increment?: number }>) => Thenable<R>,
	): Thenable<R>;
	onDidChangeActiveTextEditor(
		listener: (e: vscode.TextEditor | undefined) => void,
	): vscode.Disposable;
	onDidChangeTextEditorSelection(
		listener: (e: vscode.TextEditorSelectionChangeEvent) => void,
	): vscode.Disposable;
	onDidChangeTextEditorVisibleRanges(
		listener: (e: vscode.TextEditorVisibleRangesChangeEvent) => void,
	): vscode.Disposable;
	createWebviewViewProvider(
		viewId: string,
		provider: vscode.WebviewViewProvider,
	): vscode.Disposable;
	registerWebviewViewProvider(
		viewId: string,
		provider: vscode.WebviewViewProvider,
	): vscode.Disposable;
}

export interface CommandsAdapter {
	registerCommand(
		command: string,
		callback: (...args: unknown[]) => unknown,
	): vscode.Disposable;
	executeCommand<T>(
		command: string,
		...args: unknown[]
	): Promise<T | undefined>;
}

export interface ExtensionContextAdapter {
	readonly subscriptions: vscode.Disposable[];
	readonly globalState: StorageAdapter;
	readonly workspaceState: WorkspaceStorageAdapter;
	readonly globalStorageUri: vscode.Uri;
	readonly secrets: SecretStorageAdapter;
	readonly extensionUri: vscode.Uri;
	readonly extensionPath: string;
	readonly environmentVariableCollection: vscode.EnvironmentVariableCollection;
	readonly extensionMode: vscode.ExtensionMode;
}

export interface TelemetryAdapter {
	readonly isTelemetryEnabled: boolean;
	onDidChangeTelemetryEnabled(
		listener: (enabled: boolean) => void,
	): vscode.Disposable;
}

// Implementation using actual VS Code APIs
export function createStorageAdapter(
	context: vscode.ExtensionContext,
): StorageAdapter {
	return {
		get<T>(key: string, defaultValue: T): T {
			return context.globalState.get<T>(key) ?? defaultValue;
		},
		async update(key: string, value: unknown): Promise<void> {
			await context.globalState.update(key, value);
		},
		async delete(key: string): Promise<void> {
			await context.globalState.update(key, undefined);
		},
	};
}

export function createWorkspaceStorageAdapter(
	context: vscode.ExtensionContext,
): WorkspaceStorageAdapter {
	return {
		get<T>(key: string, defaultValue: T): T {
			return context.workspaceState.get<T>(key) ?? defaultValue;
		},
		async update(key: string, value: unknown): Promise<void> {
			await context.workspaceState.update(key, value);
		},
		async delete(key: string): Promise<void> {
			await context.workspaceState.update(key, undefined);
		},
	};
}

export function createGlobalStorageAdapter(
	context: vscode.ExtensionContext,
): GlobalStorageAdapter {
	return {
		get uri() {
			return context.globalStorageUri;
		},
		async readFile(path: string): Promise<Uint8Array> {
			const uri = vscode.Uri.joinPath(context.globalStorageUri, path);
			return vscode.workspace.fs.readFile(uri);
		},
		async writeFile(path: string, data: Uint8Array): Promise<void> {
			const uri = vscode.Uri.joinPath(context.globalStorageUri, path);
			await vscode.workspace.fs.writeFile(uri, data);
		},
		async deleteFile(path: string): Promise<void> {
			const uri = vscode.Uri.joinPath(context.globalStorageUri, path);
			try {
				await vscode.workspace.fs.delete(uri);
			} catch {
				// Ignore if not exists
			}
		},
		async listFiles(): Promise<string[]> {
			try {
				const entries = await vscode.workspace.fs.readDirectory(
					context.globalStorageUri,
				);
				return entries.map(([name]) => name);
			} catch {
				return [];
			}
		},
	};
}

export function createSecretStorageAdapter(
	context: vscode.ExtensionContext,
): SecretStorageAdapter {
	return {
		async get(key: string): Promise<string | undefined> {
			return context.secrets.get(key);
		},
		async store(key: string, value: string): Promise<void> {
			await context.secrets.store(key, value);
		},
		async delete(key: string): Promise<void> {
			await context.secrets.delete(key);
		},
	};
}

export function createConfigurationAdapter(): ConfigurationAdapter {
	return {
		get<T>(section: string, defaultValue: T): T {
			return (
				vscode.workspace.getConfiguration().get<T>(section) ?? defaultValue
			);
		},
		async update(
			section: string,
			value: unknown,
			configurationTarget?: vscode.ConfigurationTarget,
		): Promise<void> {
			await vscode.workspace
				.getConfiguration()
				.update(
					section,
					value,
					configurationTarget ?? vscode.ConfigurationTarget.Global,
				);
		},
		onDidChange(
			listener: (e: vscode.ConfigurationChangeEvent) => void,
		): vscode.Disposable {
			return vscode.workspace.onDidChangeConfiguration(listener);
		},
	};
}

export function createWorkspaceAdapter(): WorkspaceAdapter {
	return {
		get workspaceFolders() {
			return vscode.workspace.workspaceFolders;
		},
		getWorkspaceFolder(uri: vscode.Uri): vscode.WorkspaceFolder | undefined {
			return vscode.workspace.getWorkspaceFolder(uri);
		},
		onDidChangeWorkspaceFolders(
			listener: (e: vscode.WorkspaceFoldersChangeEvent) => void,
		): vscode.Disposable {
			return vscode.workspace.onDidChangeWorkspaceFolders(listener);
		},
		fs: {
			async readFile(uri: vscode.Uri): Promise<Uint8Array> {
				return vscode.workspace.fs.readFile(uri);
			},
			async writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void> {
				await vscode.workspace.fs.writeFile(uri, content);
			},
			async delete(
				uri: vscode.Uri,
				options?: { recursive?: boolean },
			): Promise<void> {
				await vscode.workspace.fs.delete(uri, options);
			},
			async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
				return vscode.workspace.fs.stat(uri);
			},
			async readDirectory(
				uri: vscode.Uri,
			): Promise<[string, vscode.FileType][]> {
				return vscode.workspace.fs.readDirectory(uri);
			},
		},
	};
}

export function createWindowAdapter(): WindowAdapter {
	return {
		get activeTextEditor() {
			return vscode.window.activeTextEditor;
		},
		showInformationMessage(message: string): Thenable<string | undefined> {
			return vscode.window.showInformationMessage(message);
		},
		showWarningMessage(message: string): Thenable<string | undefined> {
			return vscode.window.showWarningMessage(message);
		},
		showErrorMessage(message: string): Thenable<string | undefined> {
			return vscode.window.showErrorMessage(message);
		},
		showQuickPick(
			items: readonly string[],
			options?: { placeHolder?: string },
		): Thenable<string | undefined> {
			return vscode.window.showQuickPick(items, options);
		},
		withProgress<R>(
			options: vscode.ProgressOptions,
			task: (progress: vscode.Progress<{ increment?: number }>) => Thenable<R>,
		): Thenable<R> {
			return vscode.window.withProgress(options, task);
		},
		onDidChangeActiveTextEditor(
			listener: (e: vscode.TextEditor | undefined) => void,
		): vscode.Disposable {
			return vscode.window.onDidChangeActiveTextEditor(listener);
		},
		onDidChangeTextEditorSelection(
			listener: (e: vscode.TextEditorSelectionChangeEvent) => void,
		): vscode.Disposable {
			return vscode.window.onDidChangeTextEditorSelection(listener);
		},
		onDidChangeTextEditorVisibleRanges(
			listener: (e: vscode.TextEditorVisibleRangesChangeEvent) => void,
		): vscode.Disposable {
			return vscode.window.onDidChangeTextEditorVisibleRanges(listener);
		},
		createWebviewViewProvider(
			viewId: string,
			provider: vscode.WebviewViewProvider,
		): vscode.Disposable {
			return vscode.window.registerWebviewViewProvider(viewId, provider);
		},
		registerWebviewViewProvider(
			viewId: string,
			provider: vscode.WebviewViewProvider,
		): vscode.Disposable {
			return vscode.window.registerWebviewViewProvider(viewId, provider);
		},
	};
}

export function createCommandsAdapter(): CommandsAdapter {
	return {
		registerCommand(
			command: string,
			callback: (...args: unknown[]) => unknown,
		): vscode.Disposable {
			return vscode.commands.registerCommand(command, callback);
		},
		async executeCommand<T>(
			command: string,
			...args: unknown[]
		): Promise<T | undefined> {
			return vscode.commands.executeCommand<T>(command, ...args);
		},
	};
}

export function createExtensionContextAdapter(
	context: vscode.ExtensionContext,
): ExtensionContextAdapter {
	return {
		get subscriptions() {
			return context.subscriptions;
		},
		get globalState() {
			return createStorageAdapter(context);
		},
		get workspaceState() {
			return createWorkspaceStorageAdapter(context);
		},
		get globalStorageUri() {
			return context.globalStorageUri;
		},
		get secrets() {
			return createSecretStorageAdapter(context);
		},
		get extensionUri() {
			return context.extensionUri;
		},
		get extensionPath() {
			return context.extensionPath;
		},
		get environmentVariableCollection() {
			return context.environmentVariableCollection;
		},
		get extensionMode() {
			return context.extensionMode;
		},
	};
}

export function createTelemetryAdapter(): TelemetryAdapter {
	return {
		get isTelemetryEnabled() {
			return vscode.env.isTelemetryEnabled;
		},
		onDidChangeTelemetryEnabled(
			listener: (enabled: boolean) => void,
		): vscode.Disposable {
			return vscode.env.onDidChangeTelemetryEnabled(listener);
		},
	};
}

// Composite platform adapter
export interface PlatformAdapter {
	readonly storage: StorageAdapter;
	readonly workspaceStorage: WorkspaceStorageAdapter;
	readonly globalStorage: GlobalStorageAdapter;
	readonly secrets: SecretStorageAdapter;
	readonly configuration: ConfigurationAdapter;
	readonly workspace: WorkspaceAdapter;
	readonly window: WindowAdapter;
	readonly commands: CommandsAdapter;
	readonly context: ExtensionContextAdapter;
	readonly telemetry: TelemetryAdapter;
	readonly eventBus: EventBus;
}

export function createPlatformAdapter(
	context: vscode.ExtensionContext,
): PlatformAdapter {
	return {
		storage: createStorageAdapter(context),
		workspaceStorage: createWorkspaceStorageAdapter(context),
		globalStorage: createGlobalStorageAdapter(context),
		secrets: createSecretStorageAdapter(context),
		configuration: createConfigurationAdapter(),
		workspace: createWorkspaceAdapter(),
		window: createWindowAdapter(),
		commands: createCommandsAdapter(),
		context: createExtensionContextAdapter(context),
		telemetry: createTelemetryAdapter(),
		eventBus,
	};
}
