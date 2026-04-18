import { Redis } from '@upstash/redis';
import { getRateLimitConfig } from './config';

export type UserTier = 'free' | 'pro' | 'elite';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number; // -1 = unlimited
  reset: number;     // Unix ms timestamp of daily reset
  limitedBy?: 'ip' | 'fingerprint' | 'user'; // which key triggered the block
}

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

function endOfDayMs(): number {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d.getTime();
}

function ttlSeconds(): number {
  return Math.ceil((endOfDayMs() - Date.now()) / 1000) + 60; // +60s buffer
}

async function getCount(redis: Redis, key: string): Promise<number> {
  const val = await redis.get<number>(key);
  return val ?? 0;
}

async function increment(redis: Redis, key: string): Promise<number> {
  const newVal = await redis.incr(key);
  if (newVal === 1) await redis.expire(key, ttlSeconds()); // set TTL on first write
  return newVal;
}

export async function checkRateLimit(options: {
  ip: string;
  fingerprint?: string | null;
  tier: UserTier;
  userId?: string | null;
}): Promise<RateLimitResult> {
  const { ip, fingerprint, tier, userId } = options;
  const reset = endOfDayMs();

  // Pro and Elite are unlimited — skip all Redis checks
  if (tier === 'pro' || tier === 'elite') {
    return { allowed: true, remaining: -1, reset };
  }

  const redis = getRedis();

  // If Redis is not configured, allow but warn (dev mode)
  if (!redis) {
    console.warn('[RateLimit] Redis not configured — rate limiting disabled');
    return { allowed: true, remaining: 99, reset };
  }

  const config = await getRateLimitConfig();
  const LIMIT = config.free_daily; // default 2
  const today = todayKey();

  // Build the set of keys to check: userId > fingerprint > ip (priority order)
  // We check all three and block if ANY exceeds the limit.
  // This means a user who resets their modem gets a new IP but the fingerprint
  // still catches them, and vice versa.
  const keys: { key: string; label: 'ip' | 'fingerprint' | 'user' }[] = [];

  if (userId) keys.push({ key: `scryveme:rl:user:${userId}:${today}`, label: 'user' });
  if (fingerprint) keys.push({ key: `scryveme:rl:fp:${fingerprint}:${today}`, label: 'fingerprint' });
  keys.push({ key: `scryveme:rl:ip:${ip}:${today}`, label: 'ip' });

  // Fetch all current counts in parallel (read-before-write to avoid wasting increments)
  const counts = await Promise.all(keys.map(({ key }) => getCount(redis, key)));

  // Find the maximum count and which key caused it
  let maxCount = 0;
  let limitedBy: 'ip' | 'fingerprint' | 'user' | undefined;
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] > maxCount) {
      maxCount = counts[i];
      limitedBy = keys[i].label;
    }
  }

  if (maxCount >= LIMIT) {
    return { allowed: false, remaining: 0, reset, limitedBy };
  }

  // Increment all applicable counters
  await Promise.all(keys.map(({ key }) => increment(redis, key)));

  const remaining = Math.max(0, LIMIT - (maxCount + 1));
  return { allowed: true, remaining, reset };
}
