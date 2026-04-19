import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ScoreRequestSchema } from '@/lib/schemas';
import { scoreResume } from '@/lib/scorer';
import { checkRateLimit, checkBurstLimit, UserTier } from '@/lib/ratelimit';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sanitizeText, containsPromptInjection, isAdminEmail } from '@/lib/text';
import { deductCredit } from '@/lib/credits';


async function resolveUserTier(userId: string, email: string | null): Promise<UserTier> {
  const db = getSupabaseAdmin();
  if (!db) return 'free';

  const { data } = await db
    .from('users')
    .select('tier')
    .eq('id', userId)
    .maybeSingle();

  if (!data && email) {
    await db.from('users').insert({ id: userId, email, tier: 'free', credits: 0, premium_credits: 0 });
    return 'free';
  }

  return (data?.tier as UserTier) ?? 'free';
}


export async function POST(request: NextRequest) {
  try {
    // 1. Content-Type guard
    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    // 2. Parse body first (needed for testAs param)
    let body: unknown;
    try {
      const text = await request.text();
      if (text.length > 50_000) {
        return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
      }
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // 3. Resolve auth (anonymous users allowed for free tier)
    const { userId, sessionClaims } = await auth();

    // currentUser() is cached per-request by Clerk — reliable email source
    const clerkUser = userId ? await currentUser() : null;
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress
      ?? (sessionClaims?.email as string | undefined)
      ?? null;

    const isAdmin = isAdminEmail(userEmail);

    // Admin testAs — lets admin simulate any tier for UI testing
    const testAs = isAdmin
      ? (body as Record<string, unknown>)?.testAs as string | undefined
      : undefined;

    let tier: UserTier = isAdmin ? 'elite' : 'free';
    if (!isAdmin && userId) {
      const metaTier = (sessionClaims?.metadata as { tier?: string } | null)?.tier;
      if (metaTier === 'pro' || metaTier === 'elite') {
        tier = metaTier;
      } else {
        tier = await resolveUserTier(userId, userEmail);
      }
    }

    // 4. Dual-fingerprint rate limiting (free tier daily cap)
    const ip          = request.headers.get('x-real-client-ip') || '127.0.0.1';
    const fingerprint = request.headers.get('x-fingerprint') || null;

    // Admin with testAs='ratelimited' gets the upgrade prompt for testing
    if (isAdmin && testAs === 'ratelimited') {
      const fakeReset = Date.now() + 3_600_000;
      return NextResponse.json(
        {
          error: "You've used your 2 free scores for today. Purchase a credit for ₹19 or wait until tomorrow.",
          code:  'RATE_LIMITED',
          reset: fakeReset,
        },
        { status: 429, headers: { 'Retry-After': '3600', 'X-RateLimit-Remaining': '0' } },
      );
    }

    const effectiveTier: UserTier = (isAdmin && testAs === 'free') ? 'free' : tier;
    const { allowed, remaining, reset } = await checkRateLimit({
      ip, fingerprint, tier: effectiveTier, userId,
    });

    // 5. If rate-limited on free tier, try deducting a pay-per-use credit
    let usedCredit    = false;
    let creditBalance = 0;

    if (!allowed) {
      if (userId) {
        if (!await checkBurstLimit(userId)) {
          return NextResponse.json(
            { error: 'Too many requests. Please slow down.', code: 'BURST_LIMITED' },
            { status: 429, headers: { 'Retry-After': '60' } },
          );
        }

        // Admin with testAs='paid' simulates having a pay-per-use credit (no actual deduction)
        if (isAdmin && testAs === 'paid') {
          usedCredit    = true;
          creditBalance = 0;
        } else {
          const deduct = await deductCredit(userId, 'deduct_credit');
          if (deduct.ok) {
            usedCredit    = true;
            creditBalance = deduct.remaining;
          }
        }
      }

      if (!usedCredit) {
        return NextResponse.json(
          {
            error: "You've used your 2 free scores for today. Purchase a credit for ₹19 or wait until tomorrow.",
            code:  'RATE_LIMITED',
            reset,
          },
          {
            status: 429,
            headers: {
              'Retry-After':           String(Math.ceil((reset - Date.now()) / 1000)),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }
    }

    // 6. Zod validation
    const parsed = ScoreRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 422 }
      );
    }

    const { resumeText, jobRole, jobDescription } = parsed.data;
    const cleanResume = sanitizeText(resumeText);
    const cleanJD     = jobDescription ? sanitizeText(jobDescription) : undefined;

    // 7. Prompt injection check
    if (containsPromptInjection(cleanResume) || (cleanJD && containsPromptInjection(cleanJD))) {
      return NextResponse.json({ error: 'Invalid content detected in input' }, { status: 422 });
    }

    // 8. Score
    const result = await scoreResume({ resumeText: cleanResume, jobRole, jobDescription: cleanJD });

    const responseTier: UserTier = (isAdmin && testAs === 'paid') ? 'free'
      : (isAdmin && testAs === 'free')  ? 'free'
      : tier;

    // Strip paid-only fields for free-tier responses (no credit used, not pro/elite)
    const isPaidResponse = responseTier === 'pro' || responseTier === 'elite' || usedCredit;
    const strippedResult = isPaidResponse ? result : {
      ...result,
      improved_bullets:     undefined,
      bullet_explanations:  undefined,
      critical_keywords:    undefined,
      optional_keywords:    undefined,
      projected_score:      undefined,
    };

    return NextResponse.json(
      {
        ...strippedResult,
        tier: responseTier,
        ...(isAdmin && { isAdmin: true }),
        ...(usedCredit && { creditUsed: true, creditsRemaining: creditBalance }),
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': remaining === -1 ? 'unlimited' : String(remaining),
          'Cache-Control':         'no-store',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/score] Error:', message);

    if (message.includes('API key')) {
      return NextResponse.json({ error: 'Service configuration error' }, { status: 503 });
    }
    return NextResponse.json(
      { error: 'Scoring failed. Please try again in a moment.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
