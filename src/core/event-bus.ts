/**
 * Simple event bus for decoupled communication within the extension host.
 */

import type { Disposable } from "vscode";

export type EventHandler<T> = (payload: T) => void;
export type Unsubscribe = Disposable;

export interface EventBus {
  /** Subscribe to an event */
  on<T>(event: string, handler: EventHandler<T>): Unsubscribe;
  /** Emit an event */
  emit<T>(event: string, payload: T): void;
  /** Remove all listeners for an event */
  off(event: string): void;
  /** Remove all listeners */
  clear(): void;
}

function createEventBus(): EventBus {
  const listeners = new Map<string, Set<EventHandler<unknown>>>();

  return {
    on<T>(event: string, handler: EventHandler<T>): Unsubscribe {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(handler as EventHandler<unknown>);
      return {
        dispose() {
          const set = listeners.get(event);
          if (set) {
            set.delete(handler as EventHandler<unknown>);
          }
        },
      };
    },
    emit<T>(event: string, payload: T): void {
      const set = listeners.get(event);
      if (set) {
        for (const handler of set) {
          try {
            handler(payload);
          } catch (error) {
            console.error(`[EventBus] Error in handler for ${event}:`, error);
          }
        }
      }
    },
    off(event: string): void {
      listeners.delete(event);
    },
    clear(): void {
      listeners.clear();
    },
  };
}

export const eventBus = createEventBus();
