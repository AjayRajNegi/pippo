/**
 * Scheduling primitives for routine timers and reminders.
 * Uses injected clock for testability.
 */

export interface Clock {
  now(): number; // Unix timestamp in milliseconds
  setTimeout(callback: () => void, ms: number): TimerHandle;
  clearTimeout(handle: TimerHandle): void;
  setInterval(callback: () => void, ms: number): TimerHandle;
  clearInterval(handle: TimerHandle): void;
}

export type TimerHandle = ReturnType<typeof setTimeout>;

export function createSystemClock(): Clock {
  return {
    now: () => Date.now(),
    setTimeout: (cb, ms) => setTimeout(cb, ms),
    clearTimeout: (handle) => clearTimeout(handle),
    setInterval: (cb, ms) => setInterval(cb, ms),
    clearInterval: (handle) => clearInterval(handle),
  };
}

/**
 * Creates a timer that fires at a specific target time, adjusting for clock changes.
 * Returns a handle that can be cancelled.
 */
export function setTimerAt(
  clock: Clock,
  targetTime: number,
  callback: () => void,
): TimerHandle {
  const now = clock.now();
  const delay = Math.max(0, targetTime - now);
  return clock.setTimeout(callback, delay);
}

/**
 * Creates a recurring timer that fires at fixed intervals from a base time.
 * Handles clock jumps by recalculating next fire time on each tick.
 */
export function setIntervalFrom(
  clock: Clock,
  baseTime: number,
  intervalMs: number,
  callback: () => void,
): TimerHandle {
  let nextFireTime = baseTime + intervalMs;

  const tick = () => {
    const now = clock.now();
    // Fire if we're at or past the scheduled time
    if (now >= nextFireTime) {
      callback();
      // Schedule next fire from the theoretical next time, not from now
      // This prevents drift
      nextFireTime += intervalMs;
      // If we're still behind (e.g., system sleep), catch up
      if (nextFireTime <= now) {
        nextFireTime = now + intervalMs;
      }
    }
    // Schedule next check
    const delay = Math.max(1, nextFireTime - clock.now());
    clock.setTimeout(tick, delay);
  };

  // Initial scheduling
  const initialDelay = Math.max(1, nextFireTime - clock.now());
  return clock.setTimeout(tick, initialDelay);
}

/**
 * Debounce function for event batching.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number,
  clock: Clock = createSystemClock(),
): T & { cancel: () => void } {
  let handle: TimerHandle | null = null;
  let lastArgs: unknown[] | null = null;

  const debounced = ((...args: unknown[]) => {
    lastArgs = args;
    if (handle) {
      clock.clearTimeout(handle);
    }
    handle = clock.setTimeout(() => {
      handle = null;
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
    }, ms);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (handle) {
      clock.clearTimeout(handle);
      handle = null;
    }
  };

  return debounced;
}

/**
 * Throttle function for rate limiting.
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number,
  clock: Clock = createSystemClock(),
): T & { cancel: () => void } {
  let handle: TimerHandle | null = null;
  let lastArgs: unknown[] | null = null;
  let lastCall = 0;

  const throttled = ((...args: unknown[]) => {
    const now = clock.now();
    lastArgs = args;

    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
      return;
    }

    if (!handle) {
      const delay = ms - (now - lastCall);
      handle = clock.setTimeout(() => {
        handle = null;
        lastCall = clock.now();
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, delay);
    }
  }) as T & { cancel: () => void };

  throttled.cancel = () => {
    if (handle) {
      clock.clearTimeout(handle);
      handle = null;
    }
  };

  return throttled;
}
