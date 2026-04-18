import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createHmac } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { PRICES } from '@/lib/razorpay-server';

interface VerifyBody {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = (await request.json()) as Partial<VerifyBody>;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
    }

    // ── 1. Verify Razorpay HMAC signature ──────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 });
    }

    const expectedSig = createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      console.warn('[verify] Signature mismatch — possible tampering');
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // ── 2. Idempotency: reject duplicate payment IDs ────────────
    const db = getSupabaseAdmin();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data: existing } = await db
      .from('payments')
      .select('id')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle();

    if (existing) {
      // Already processed — return success (idempotent)
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    // ── 3. Fetch current credits ────────────────────────────────
    const { data: user, error: fetchErr } = await db
      .from('users')
      .select('credits')
      .eq('id', userId)
      .maybeSingle();

    if (fetchErr || !user) {
      // User row might not exist yet (anonymous flow) — create it
      await db.from('users').upsert({ id: userId, credits: 0, tier: 'free' }, { onConflict: 'id' });
    }

    const currentCredits = user?.credits ?? 0;
    const newCredits     = currentCredits + 1;

    // ── 4. Add credit + record payment (parallel) ───────────────
    const [updateResult, insertResult] = await Promise.all([
      db.from('users')
        .update({ credits: newCredits })
        .eq('id', userId),
      db.from('payments').insert({
        user_id:               userId,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        amount_paise:          PRICES.pay_per_use,
        type:                  'pay_per_use',
        credits_added:         1,
        status:                'captured',
      }),
    ]);

    if (updateResult.error || insertResult.error) {
      console.error('[verify] DB error:', updateResult.error ?? insertResult.error);
      return NextResponse.json({ error: 'Failed to record payment. Contact support.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, creditsRemaining: newCredits });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[verify]', msg);
    return NextResponse.json({ error: 'Payment verification failed. Contact support.' }, { status: 500 });
  }
}
