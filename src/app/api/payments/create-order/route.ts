import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRazorpay, PRICES, PriceKey } from '@/lib/razorpay-server';

const PRODUCT_DESCRIPTIONS: Record<PriceKey, string> = {
  pay_per_use: '1 Resume Score Credit — ScyrveMe',
  premium:     '1 Premium Resume Enhancement — ScyrveMe',
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Sign in to purchase' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const type: PriceKey = body?.type === 'premium' ? 'premium' : 'pay_per_use';

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount:   PRICES[type],
      currency: 'INR',
      receipt:  `scryveme_${type.slice(0, 2)}_${userId.slice(-8)}_${Date.now()}`,
      notes: {
        user_id:     userId,
        product:     type,
        description: PRODUCT_DESCRIPTIONS[type],
      },
    });

    return NextResponse.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      type,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[create-order]', msg);

    if (msg.includes('env vars')) {
      return NextResponse.json({ error: 'Payment gateway not configured yet' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Could not create payment order. Try again.' }, { status: 500 });
  }
}
