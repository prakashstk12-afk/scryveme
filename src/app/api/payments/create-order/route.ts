import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRazorpay, PRICES } from '@/lib/razorpay-server';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Sign in to purchase a score credit' }, { status: 401 });
    }

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: PRICES.pay_per_use,         // 1500 paise = ₹15
      currency: 'INR',
      receipt: `scryveme_pu_${userId.slice(-8)}_${Date.now()}`,
      notes: {
        user_id: userId,
        product: 'pay_per_use',
        description: '1 Resume Score Credit — ScyrveMe',
      },
    });

    return NextResponse.json({
      orderId:  order.id,
      amount:   order.amount,    // paise
      currency: order.currency,  // INR
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
