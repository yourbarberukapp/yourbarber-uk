/**
 * DB-backed fixed-window rate limiter.
 *
 * Ported from the MyLoyalty pattern: in-memory counters don't survive Vercel
 * serverless cold starts (each instance gets its own map), so brute-force
 * protection has to live in Postgres to be shared across every instance.
 *
 * Fails open (allows the request) if the DB is unavailable — a DB blip
 * shouldn't turn a low-friction login into a hard outage.
 */
import { db } from '@/lib/db';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export async function checkRateLimit(
  bucketName: string,
  identifier: string,
  opts: { windowMs: number; max: number }
): Promise<RateLimitResult> {
  const now = new Date();
  // Fixed windows aligned to epoch time so concurrent callers converge on the
  // same windowStart without a read-then-write race.
  const windowStart = new Date(Math.floor(now.getTime() / opts.windowMs) * opts.windowMs);
  const expiresAt = new Date(windowStart.getTime() + opts.windowMs);
  const bucketKey = `${bucketName}:${identifier}:${windowStart.getTime()}`;

  try {
    // Opportunistic cleanup of expired rows — serverless has no long-lived
    // process for a setInterval sweep.
    await db.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => {});

    const row = await db.rateLimitBucket.upsert({
      where: { bucketKey },
      create: { bucketKey, count: 1, windowStart, expiresAt },
      update: { count: { increment: 1 } },
      select: { count: true },
    });

    const count = row.count;
    const allowed = count <= opts.max;
    return {
      allowed,
      remaining: Math.max(0, opts.max - count),
      retryAfterMs: allowed ? 0 : expiresAt.getTime() - now.getTime(),
    };
  } catch {
    return { allowed: true, remaining: opts.max, retryAfterMs: 0 };
  }
}
