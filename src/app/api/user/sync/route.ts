import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { getSupabaseAdmin } from '@/lib/supabase-server';

interface ClerkUserEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: {
    id: string;
    email_addresses: { email_address: string; id: string }[];
    primary_email_address_id: string;
    public_metadata: Record<string, unknown>;
  };
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[UserSync] CLERK_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Verify Svix signature
  const svixId        = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 });
  }

  const body = await request.text();
  const wh = new Webhook(webhookSecret);

  let event: ClerkUserEvent;
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    console.warn('[UserSync] Supabase not configured — skipping sync');
    return NextResponse.json({ ok: true });
  }

  const { type, data } = event;

  if (type === 'user.created') {
    const primaryEmail = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id
    )?.email_address;

    if (!primaryEmail) {
      return NextResponse.json({ error: 'No primary email' }, { status: 400 });
    }

    // ignoreDuplicates: true — safe if webhook fires twice; never overwrites an existing row
    const { error } = await db.from('users').upsert(
      { id: data.id, email: primaryEmail, tier: 'free', credits: 0, premium_credits: 0 },
      { onConflict: 'id', ignoreDuplicates: true }
    );

    if (error) {
      console.error('[UserSync] Supabase upsert error:', error.code, error.message);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  if (type === 'user.updated') {
    const primaryEmail = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id
    )?.email_address;

    if (!primaryEmail) {
      return NextResponse.json({ error: 'No primary email' }, { status: 400 });
    }

    // Only update email — tier and credits are managed by the payment flow in Supabase,
    // not Clerk metadata. Updating tier here would reset paid users back to 'free'.
    const { error } = await db.from('users').update({ email: primaryEmail }).eq('id', data.id);

    if (error) {
      console.error('[UserSync] Supabase update error:', error.message);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  if (type === 'user.deleted') {
    await db.from('users').delete().eq('id', data.id);
  }

  return NextResponse.json({ ok: true });
}
