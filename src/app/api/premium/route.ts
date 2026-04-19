import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ScoreRequestSchema, ScoreResponseSchema } from '@/lib/schemas';
import { premiumEnhanceResume } from '@/lib/scorer';
import { checkBurstLimit } from '@/lib/ratelimit';
import { sanitizeText, isAdminEmail } from '@/lib/text';
import { deductCredit } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth required — premium is always a paid action
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Sign in to use Premium Enhancement', code: 'UNAUTHENTICATED' },
        { status: 401 },
      );
    }

    // 2. Per-minute burst check
    if (!await checkBurstLimit(userId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.', code: 'BURST_LIMITED' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    // 3. Parse body — expects { resumeText, jobRole?, jobDescription?, scoreData }
    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    let body: unknown;
    try {
      const text = await request.text();
      if (text.length > 60_000) {
        return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
      }
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Validate resume fields
    const resumeParsed = ScoreRequestSchema.safeParse(body);
    if (!resumeParsed.success) {
      return NextResponse.json(
        { error: resumeParsed.error.issues[0]?.message || 'Invalid input' },
        { status: 422 },
      );
    }

    // Validate scoreData (initial score result from /api/score)
    const bodyObj = body as Record<string, unknown>;
    const scoreParsed = ScoreResponseSchema.safeParse(bodyObj.scoreData);
    if (!scoreParsed.success) {
      return NextResponse.json(
        { error: 'Missing or invalid scoreData — run /api/score first' },
        { status: 422 },
      );
    }

    // 4. Atomically deduct 1 premium credit (admins bypass)
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress
      ?? (sessionClaims?.email as string | undefined)
      ?? null;
    const isAdmin   = isAdminEmail(userEmail);
    let premiumCreditsRemaining = -1;

    if (!isAdmin) {
      const deduct = await deductCredit(userId, 'deduct_premium_credit');
      if (!deduct.ok) {
        return NextResponse.json(
          {
            error: 'No premium credits available. Purchase Premium (₹99) to continue.',
            code:  'NO_PREMIUM_CREDIT',
          },
          { status: 402 },
        );
      }
      premiumCreditsRemaining = deduct.remaining;
    }

    // 5. Run premium AI enhancement
    const { resumeText, jobDescription } = resumeParsed.data;
    const cleanResume = sanitizeText(resumeText);
    const cleanJD     = jobDescription ? sanitizeText(jobDescription) : undefined;

    const enhancement = await premiumEnhanceResume(cleanResume, scoreParsed.data, cleanJD);

    return NextResponse.json(
      {
        ...enhancement,
        premiumCreditsRemaining,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/premium] Error:', message);

    if (message.includes('API key')) {
      return NextResponse.json({ error: 'Service configuration error' }, { status: 503 });
    }
    return NextResponse.json(
      { error: 'Premium enhancement failed. Please try again.' },
      { status: 500 },
    );
  }
}
