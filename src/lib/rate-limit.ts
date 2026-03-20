import { NextRequest, NextResponse } from "next/server";

/**
 * Shared in-memory sliding-window rate limiter for API routes.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
 *
 *   export async function POST(request: NextRequest) {
 *     const blocked = limiter(request);
 *     if (blocked) return blocked;
 *     // ... handle request
 *   }
 */

interface RateLimitEntry {
  timestamps: number[];
}

// Global store shared across all limiters (keyed by limiter id + IP)
const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 300_000; // 5 minutes

function cleanup(maxAge: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  const cutoff = now - maxAge;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

/** Extract client IP from request headers */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

interface RateLimiterOptions {
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number;
  /** Max requests per IP per window */
  max: number;
  /** Unique identifier for this limiter (auto-generated if omitted) */
  id?: string;
}

let autoId = 0;

/**
 * Create a rate limiter function.
 * Returns a function that accepts a NextRequest and returns:
 *   - null if the request is allowed
 *   - a 429 NextResponse if rate limited
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max;
  const id = options.id ?? `rl-${++autoId}`;

  return function rateLimit(request: NextRequest, extraKey?: string): NextResponse | null {
    cleanup(windowMs);

    const ip = getClientIp(request);
    const key = `${id}:${ip}${extraKey ? `:${extraKey}` : ""}`;
    const now = Date.now();
    const cutoff = now - windowMs;

    let entry = store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }

    // Remove expired timestamps
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

    if (entry.timestamps.length >= max) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(windowMs / 1000)),
          },
        },
      );
    }

    entry.timestamps.push(now);
    return null; // Allowed
  };
}
