/**
 * Smoke test for extension activation.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";

// Mock VS Code API
vi.mock("vscode", () => ({
  ExtensionContext: vi.fn(),
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, defaultValue: unknown) => defaultValue),
      update: vi.fn(),
      onDidChange: vi.fn(),
    })),
    workspaceFolders: undefined,
    onDidChangeWorkspaceFolders: vi.fn(),
    onDidChangeConfiguration: vi.fn(),
    fs: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      delete: vi.fn(),
      stat: vi.fn(),
      readDirectory: vi.fn(),
    },
  },
  window: {
    activeTextEditor: undefined,
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showQuickPick: vi.fn(),
    withProgress: vi.fn(),
    onDidChangeActiveTextEditor: vi.fn(),
    onDidChangeTextEditorSelection: vi.fn(),
    onDidChangeTextEditorVisibleRanges: vi.fn(),
    registerWebviewViewProvider: vi.fn(),
  },
  commands: {
    registerCommand: vi.fn(),
    executeCommand: vi.fn(),
  },
  env: {
    isTelemetryEnabled: false,
    onDidChangeTelemetryEnabled: vi.fn(),
  },
  Uri: {
    joinPath: vi.fn((...args: string[]) => ({
      fsPath: args.join("/"),
      toString: () => args.join("/"),
    })),
  },
  Disposable: vi.fn(),
  ConfigurationTarget: {
    Global: 1,
  },
  FileType: {
    File: 1,
    Directory: 2,
  },
}));

describe("Extension Activation", () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      subscriptions: [],
      globalState: {
        get: vi.fn(),
        update: vi.fn(),
      },
      workspaceState: {
        get: vi.fn(),
        update: vi.fn(),
      },
      globalStorageUri: { fsPath: "/tmp/test-storage" },
      secrets: {
        get: vi.fn(),
        store: vi.fn(),
        delete: vi.fn(),
      },
      extensionUri: { fsPath: "/tmp/test-extension" },
      extensionPath: "/tmp/test-extension",
      environmentVariableCollection: {},
      extensionMode: 1,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should activate without errors", async () => {
    // Dynamic import to get fresh module with mocks
    const { activate } = await import("../extension");

    // Should not throw
    await activate(mockContext);

    // Verify commands were registered
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      "droidCompanion.helloWorld",
      expect.any(Function),
    );

    // Verify webview provider was registered
    expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith(
      "droidCompanion",
      expect.any(Object),
    );
  });

  it("should register helloWorld command", async () => {
    const { activate } = await import("../extension");
    await activate(mockContext);

    const commandCall = (
      vscode.commands.registerCommand as any
    ).mock.calls.find((call: any[]) => call[0] === "droidCompanion.helloWorld");

    expect(commandCall).toBeDefined();
    expect(typeof commandCall[1]).toBe("function");
  });

  it("should have deactivate function", async () => {
    const { deactivate } = await import("../extension");
    expect(typeof deactivate).toBe("function");
    expect(() => deactivate()).not.toThrow();
  });
});

describe("Message Protocol", () => {
  it("should validate incoming messages", async () => {
    const { validateIncomingMessage, MESSAGE_PROTOCOL_VERSION } =
      await import("../core/messages");

    const validMessage = {
      version: MESSAGE_PROTOCOL_VERSION,
      type: "routineAction",
      direction: "webview-to-extension" as const,
      action: "start" as const,
    };

    const result = validateIncomingMessage(validMessage);
    expect(result).toEqual(validMessage);
  });

  it("should reject messages with wrong version", async () => {
    const { validateIncomingMessage, MESSAGE_PROTOCOL_VERSION } =
      await import("../core/messages");

    const invalidMessage = {
      version: MESSAGE_PROTOCOL_VERSION + 1,
      type: "routineAction",
      direction: "webview-to-extension" as const,
      action: "start" as const,
    };

    expect(() => validateIncomingMessage(invalidMessage)).toThrow(
      "Unsupported protocol version",
    );
  });

  it("should reject messages with missing fields", async () => {
    const { validateIncomingMessage } = await import("../core/messages");

    expect(() => validateIncomingMessage({})).toThrow(
      "Invalid incoming message format",
    );
    expect(() => validateIncomingMessage(null)).toThrow(
      "Invalid incoming message format",
    );
    expect(() => validateIncomingMessage("not an object")).toThrow(
      "Invalid incoming message format",
    );
  });
});

describe("Event Bus", () => {
  it("should publish and subscribe to events", async () => {
    const { eventBus } = await import("../core/event-bus");

    const handler = vi.fn();
    const unsubscribe = eventBus.on("test:event", handler);

    eventBus.emit("test:event", { data: "test" });

    expect(handler).toHaveBeenCalledWith({ data: "test" });

    unsubscribe.dispose();
    eventBus.emit("test:event", { data: "test2" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should clear all listeners", async () => {
    const { eventBus } = await import("../core/event-bus");

    const handler1 = vi.fn();
    const handler2 = vi.fn();

    eventBus.on("test:event1", handler1);
    eventBus.on("test:event2", handler2);

    eventBus.clear();

    eventBus.emit("test:event1", {});
    eventBus.emit("test:event2", {});

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });
});

describe("Scheduling Primitives", () => {
  it("should create system clock", async () => {
    const { createSystemClock } = await import("../core/scheduling");

    const clock = createSystemClock();
    const now = clock.now();

    expect(typeof now).toBe("number");
    expect(now).toBeGreaterThan(0);
  });

  it("should debounce function calls", async () => {
    const { debounce, createSystemClock } = await import("../core/scheduling");

    vi.useFakeTimers();
    const clock = createSystemClock();
    const fn = vi.fn();
    const debounced = debounce(fn, 100, clock);

    debounced("a");
    debounced("b");
    debounced("c");

    // Fast-forward time
    vi.advanceTimersByTime(150);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");

    vi.useRealTimers();
    debounced.cancel();
  });

  it("should throttle function calls", async () => {
    const { throttle, createSystemClock } = await import("../core/scheduling");

    vi.useFakeTimers();
    const clock = createSystemClock();
    const fn = vi.fn();
    const throttled = throttle(fn, 100, clock);

    throttled("a");
    throttled("b");
    throttled("c");

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");

    vi.advanceTimersByTime(150);

    throttled("d");

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenNthCalledWith(1, "a");
    expect(fn).toHaveBeenNthCalledWith(2, "c");
    expect(fn).toHaveBeenNthCalledWith(3, "d");

    vi.useRealTimers();
    throttled.cancel();
  });
});
