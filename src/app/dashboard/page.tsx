'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface UserAccount {
  id:             string;
  email:          string | null;
  firstName:      string | null;
  lastName:       string | null;
  tier:           string;
  credits:        number;
  premiumCredits: number;
  memberSince:    string | null;
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-3 w-24 bg-surface rounded mb-3" />
      <div className="h-8 w-16 bg-surface rounded" />
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    free:  'bg-surface text-dim border-border',
    pro:   'bg-accent-glow text-accent border-accent-border',
    elite: 'bg-warning-bg text-warning border-warning-border',
  };
  const labels: Record<string, string> = {
    free: 'Free', pro: 'Pro', elite: 'Elite',
  };
  return (
    <span className={`text-xs font-display font-bold px-2.5 py-1 rounded-full border ${styles[tier] ?? styles.free}`}>
      {labels[tier] ?? tier}
    </span>
  );
}

export default function DashboardPage() {
  const [account, setAccount]   = useState<UserAccount | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    fetch('/api/user/me')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setAccount(data);
      })
      .catch(() => setError('Failed to load account details.'))
      .finally(() => setLoading(false));
  }, []);

  const displayName = account?.firstName
    ? `${account.firstName}${account.lastName ? ' ' + account.lastName : ''}`
    : account?.email?.split('@')[0] ?? 'Account';

  const memberSince = account?.memberSince
    ? new Date(account.memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* Page title */}
        <div>
          <h1 className="font-display font-bold text-2xl text-primary">
            {loading ? 'Loading…' : `Hi, ${displayName}`}
          </h1>
          {memberSince && !loading && (
            <p className="text-dim text-sm mt-1">Member since {memberSince}</p>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Credit balances */}
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            <><SkeletonCard /><SkeletonCard /></>
          ) : (
            <>
              {/* Pay-per-use credits */}
              <div className="card">
                <p className="text-dim text-xs font-display font-semibold uppercase tracking-wider mb-2">
                  Score credits
                </p>
                <p className="font-display font-bold text-3xl text-primary">
                  {account?.credits ?? 0}
                </p>
                <p className="text-dim text-xs mt-1">₹19 each · never expire</p>
              </div>

              {/* Premium credits */}
              <div className="card">
                <p className="text-dim text-xs font-display font-semibold uppercase tracking-wider mb-2">
                  Premium credits
                </p>
                <p className="font-display font-bold text-3xl text-primary">
                  {account?.premiumCredits ?? 0}
                </p>
                <p className="text-dim text-xs mt-1">₹99 each · never expire</p>
              </div>
            </>
          )}
        </div>

        {/* Account info */}
        {!loading && account && (
          <div className="card space-y-4">
            <h2 className="section-label">Account</h2>

            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-secondary text-sm">Email</span>
              <span className="text-primary text-sm font-medium">{account.email ?? '—'}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-secondary text-sm">Plan</span>
              <TierBadge tier={account.tier} />
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="card space-y-3">
          <h2 className="section-label">Quick actions</h2>

          <Link
            href="/"
            className="flex items-center justify-between w-full rounded-xl border border-accent-border bg-accent-glow px-4 py-3 hover:brightness-110 transition-all group"
          >
            <div>
              <p className="text-sm font-display font-semibold text-primary">Score a resume</p>
              <p className="text-xs text-secondary mt-0.5">
                {account && account.credits > 0
                  ? `${account.credits} credit${account.credits !== 1 ? 's' : ''} available`
                  : '2 free scores per day'}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <Link
            href="/pricing"
            className="flex items-center justify-between w-full rounded-xl border border-border bg-surface px-4 py-3 hover:border-border-bright transition-all group"
          >
            <div>
              <p className="text-sm font-display font-semibold text-primary">Buy credits</p>
              <p className="text-xs text-secondary mt-0.5">Score credits from ₹19 · Premium from ₹99</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-dim flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}
