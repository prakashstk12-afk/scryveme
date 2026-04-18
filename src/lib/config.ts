import { Redis } from '@upstash/redis';
import { getSupabaseAdmin } from './supabase-server';

const CACHE_TTL = 300; // 5 minutes

export interface AIModelConfig {
  name: string;
  temperature: number;
  max_tokens: number;
}

export interface RateLimitConfig {
  free_daily: number;
  pro_daily: number;   // -1 = unlimited
  elite_daily: number; // -1 = unlimited
}

const DEFAULT_AI: AIModelConfig = {
  name: 'gpt-4o-mini',
  temperature: 0.2,
  max_tokens: 1200,
};

const DEFAULT_RL: RateLimitConfig = {
  free_daily: 2,
  pro_daily: -1,
  elite_daily: -1,
};

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

async function fetchFromSupabase<T>(key: string, fallback: T): Promise<T> {
  const db = getSupabaseAdmin();
  if (!db) return fallback;
  const { data, error } = await db
    .from('app_config')
    .select('value')
    .eq('key', key)
    .single();
  if (error || !data) return fallback;
  return data.value as T;
}

async function getCached<T>(cacheKey: string, dbKey: string, fallback: T): Promise<T> {
  const redis = getRedis();

  if (redis) {
    const hit = await redis.get<T>(cacheKey);
    if (hit) return hit;
  }

  const value = await fetchFromSupabase<T>(dbKey, fallback);

  if (redis) {
    await redis.set(cacheKey, value, { ex: CACHE_TTL });
  }

  return value;
}

export async function getAIConfig(): Promise<AIModelConfig> {
  return getCached<AIModelConfig>('scryveme:cfg:ai_model', 'ai_model', DEFAULT_AI);
}

export async function getRateLimitConfig(): Promise<RateLimitConfig> {
  return getCached<RateLimitConfig>('scryveme:cfg:rate_limits', 'rate_limits', DEFAULT_RL);
}

// Admin: invalidate config cache so changes take effect immediately
export async function invalidateConfigCache() {
  const redis = getRedis();
  if (!redis) return;
  await redis.del('scryveme:cfg:ai_model', 'scryveme:cfg:rate_limits');
}
