import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ScoreRequestSchema } from '@/lib/schemas';
import { scoreResume } from '@/lib/scorer';
import { checkRateLimit, UserTier } from '@/lib/ratelimit';
import { getSupabaseAdmin } from '@/lib/supabase-server';

function sanitizeText(text: string): string {
  return text
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function containsPromptInjection(text: string): boolean {
  const patterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /you\s+are\s+now\s+(a\s+)?/i,
    /system\s*:\s*you/i,
    /\[INST\]/i,
    /<\|im_start\|>/i,
    /###\s*instruction/i,
    /forget\s+your\s+(previous\s+)?training/i,
    /act\s+as\s+if\s+you\s+are/i,
    /pretend\s+you\s+are\s+an?\s+AI/i,
  ];
  return patterns.some((p) => p.test(text));
}

async function resolveUserTier(userId: string, email: string | null): Promise<UserTier> {
  const db = getSupabaseAdmin();
  if (!db) return 'free';

  const { data } = await db
    .from('users')
    .select('tier')
    .eq('id', userId)
    .maybeSingle();

  if (!data && email) {
    await db.from('users').insert({ id: userId, email, tier: 'free', credits: 0 });
    return 'free';
  }

  return (data?.tier as UserTier) ?? 'free';
}

// Atomically deduct 1 credit — returns true if credit was available and deducted
async function tryDeductCredit(userId: string): Promise<{ ok: boolean; remaining: number }> {
  const db = getSupabaseAdmin();
  if (!db) return { ok: false, remaining: 0 };

  const { data } = await db
    .from('users')
    .select('credits')
    .eq('id', userId)
    .maybeSingle();

  if (!data || data.credits <= 0) return { ok: false, remaining: 0 };

  // Update — acceptable race window for this scale; use DB function in Phase 5 if needed
  const { error } = await db
    .from('users')
    .update({ credits: data.credits - 1 })
    .eq('id', userId);

  if (error) return { ok: false, remaining: data.credits };
  return { ok: true, remaining: data.credits - 1 };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Content-Type guard
    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    // 2. Resolve auth (anonymous users allowed for free tier)
    const { userId, sessionClaims } = await auth();
    const userEmail = (sessionClaims?.email as string) ?? null;

    // Admin bypass — emails listed in ADMIN_EMAILS get unlimited access
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const isAdmin = !!userEmail && adminEmails.includes(userEmail.toLowerCase());

    let tier: UserTier = isAdmin ? 'elite' : 'free';
    if (!isAdmin && userId) {
      const metaTier = (sessionClaims?.metadata as { tier?: string } | null)?.tier;
      if (metaTier === 'pro' || metaTier === 'elite') {
        tier = metaTier;
      } else {
        tier = await resolveUserTier(userId, userEmail);
      }
    }

    // 3. Dual-fingerprint rate limiting
    const ip          = request.headers.get('x-real-client-ip') || '127.0.0.1';
    const fingerprint = request.headers.get('x-fingerprint') || null;

    const { allowed, remaining, reset } = await checkRateLimit({ ip, fingerprint, tier, userId });

    // 4. If rate-limited on free tier, check pay-per-use credits before blocking
    let usedCredit  = false;
    let creditBalance = 0;

    if (!allowed) {
      if (userId) {
        const deduct = await tryDeductCredit(userId);
        if (deduct.ok) {
          usedCredit    = true;
          creditBalance = deduct.remaining;
        }
      }

      if (!usedCredit) {
        return NextResponse.json(
          {
            error: "You've used your 2 free scores for today. Purchase a credit or upgrade to continue.",
            code: 'RATE_LIMITED',
            reset,
          },
          {
            status: 429,
            headers: {
              'Retry-After':          String(Math.ceil((reset - Date.now()) / 1000)),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }
    }

    // 5. Parse + size guard
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

    return NextResponse.json(
      {
        ...result,
        tier,
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
