// Simple in-memory rate limiter. Not distributed — suitable for single-instance or dev.
const DEFAULT_MAX = Number(process.env.AI_RATE_LIMIT_MAX || 60); // requests per window
const DEFAULT_WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60_000); // 60s

const store = new Map();

function getKeyRecord(key) {
  let rec = store.get(key);
  const now = Date.now();
  if (!rec || now - rec.start >= DEFAULT_WINDOW_MS) {
    rec = { count: 0, start: now };
    store.set(key, rec);
  }
  return rec;
}

export function allowRequest(key, weight = 1) {
  const rec = getKeyRecord(key);
  rec.count += weight;
  const allowed = rec.count <= DEFAULT_MAX;
  return {
    allowed,
    remaining: Math.max(0, DEFAULT_MAX - rec.count),
    limit: DEFAULT_MAX,
    resetAt: rec.start + DEFAULT_WINDOW_MS,
  };
}

export function getUsage(key) {
  const rec = store.get(key);
  if (!rec) return { count: 0, start: 0 };
  return rec;
}

export function resetKey(key) {
  store.delete(key);
}
