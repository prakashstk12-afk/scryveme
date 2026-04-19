import { getSupabaseAdmin } from './supabase-server';

export async function deductCredit(
  userId: string,
  rpcName: 'deduct_credit' | 'deduct_premium_credit',
): Promise<{ ok: boolean; remaining: number }> {
  const db = getSupabaseAdmin();
  if (!db) return { ok: false, remaining: 0 };

  const { data, error } = await db.rpc(rpcName, { p_user_id: userId });

  if (error) {
    console.error(`[credits] ${rpcName} RPC error:`, error);
    return { ok: false, remaining: 0 };
  }

  const remaining = typeof data === 'number' ? data : -1;
  if (remaining === -1) return { ok: false, remaining: 0 };
  return { ok: true, remaining };
}
