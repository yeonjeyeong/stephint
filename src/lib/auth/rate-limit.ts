interface AttemptEntry {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number;
}

const WINDOW_MS = 10 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const globalStore = globalThis as typeof globalThis & {
  __stephintLoginAttempts?: Map<string, AttemptEntry>;
};

const attemptStore = globalStore.__stephintLoginAttempts ?? new Map<string, AttemptEntry>();
globalStore.__stephintLoginAttempts = attemptStore;

function getEntry(key: string) {
  const entry = attemptStore.get(key);
  if (!entry) {
    return null;
  }

  if (entry.blockedUntil && entry.blockedUntil < Date.now()) {
    attemptStore.delete(key);
    return null;
  }

  if (Date.now() - entry.firstAttemptAt > WINDOW_MS) {
    attemptStore.delete(key);
    return null;
  }

  return entry;
}

export function getRateLimitDecision(keys: string[]) {
  let longestRetryMs = 0;

  for (const key of keys) {
    const entry = getEntry(key);
    if (entry?.blockedUntil && entry.blockedUntil > Date.now()) {
      longestRetryMs = Math.max(longestRetryMs, entry.blockedUntil - Date.now());
    }
  }

  return {
    allowed: longestRetryMs === 0,
    retryAfterSeconds: Math.ceil(longestRetryMs / 1000),
  };
}

export function recordFailedAttempts(keys: string[]) {
  let longestRetryMs = 0;

  for (const key of keys) {
    const current = getEntry(key);
    const next: AttemptEntry = current
      ? {
          ...current,
          count: current.count + 1,
        }
      : {
          count: 1,
          firstAttemptAt: Date.now(),
          blockedUntil: 0,
        };

    if (next.count >= MAX_ATTEMPTS) {
      next.blockedUntil = Date.now() + BLOCK_MS;
      longestRetryMs = Math.max(longestRetryMs, BLOCK_MS);
    }

    attemptStore.set(key, next);
  }

  return {
    allowed: longestRetryMs === 0,
    retryAfterSeconds: Math.ceil(longestRetryMs / 1000),
  };
}

export function clearAttempts(keys: string[]) {
  for (const key of keys) {
    attemptStore.delete(key);
  }
}
