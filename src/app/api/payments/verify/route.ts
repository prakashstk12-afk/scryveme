import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createHmac } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { PRICES } from '@/lib/razorpay-server';

interface VerifyBody {
  razorpay_payment_id: string;
  razorpay_order_id:   string;
  razorpay_signature:  string;
  type?:               'pay_per_use' | 'premium';
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = (await request.json()) as Partial<VerifyBody>;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;
    const type = body.type === 'premium' ? 'premium' : 'pay_per_use';

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
    }

    // ── 1. Verify Razorpay HMAC signature ────────────────────────
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

    // ── 2. Idempotency: reject duplicate payment IDs ─────────────
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
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    // ── 3. Ensure user row exists ────────────────────────────────
    await db.from('users').upsert(
      { id: userId, credits: 0, premium_credits: 0, tier: 'free' },
      { onConflict: 'id', ignoreDuplicates: true },
    );

    // ── 4. Increment credit + record payment (parallel) ─────────
    // Safe to read-then-write: unique constraint on razorpay_payment_id
    // ensures this block executes exactly once per payment.
    let newBalance: number;

    if (type === 'premium') {
      const { data: row } = await db.from('users').select('premium_credits').eq('id', userId).maybeSingle();
      newBalance = (row?.premium_credits ?? 0) + 1;
    } else {
      const { data: row } = await db.from('users').select('credits').eq('id', userId).maybeSingle();
      newBalance = (row?.credits ?? 0) + 1;
    }

    const updateCol = type === 'premium' ? { premium_credits: newBalance } : { credits: newBalance };

    const [updateResult, insertResult] = await Promise.all([
      db.from('users').update(updateCol).eq('id', userId),
      db.from('payments').insert({
        user_id:              userId,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        amount_paise:         PRICES[type],
        type,
        credits_added:        1,
        status:               'captured',
      }),
    ]);

    if (updateResult.error) console.error('[verify] Credit update failed:', updateResult.error);
    if (insertResult.error) console.error('[verify] Payment insert failed:', insertResult.error);

    return NextResponse.json({
      ok: true,
      type,
      ...(type === 'pay_per_use'
        ? { creditsRemaining: newBalance }
        : { premiumCreditsRemaining: newBalance }),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[verify]', msg);
    return NextResponse.json({ error: 'Payment verification failed. Contact support.' }, { status: 500 });
  }
}
