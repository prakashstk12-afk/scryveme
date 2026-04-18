'use client';

let cached: string | null = null;

export async function getFingerprint(): Promise<string | null> {
  if (cached) return cached;
  try {
    const FP = await import('@fingerprintjs/fingerprintjs');
    const agent = await FP.load();
    const result = await agent.get();
    cached = result.visitorId;
    return cached;
  } catch {
    return null;
  }
}
