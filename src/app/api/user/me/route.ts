import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data, error } = await db
    .from('users')
    .select('tier, credits, premium_credits, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load account' }, { status: 500 });
  }

  // Row may not exist yet if user never scored — return safe defaults
  return NextResponse.json({
    id:               userId,
    email,
    firstName:        clerkUser?.firstName ?? null,
    lastName:         clerkUser?.lastName  ?? null,
    tier:             data?.tier             ?? 'free',
    credits:          data?.credits          ?? 0,
    premiumCredits:   data?.premium_credits  ?? 0,
    memberSince:      data?.created_at       ?? null,
  });
}
