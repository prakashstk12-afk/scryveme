'use client';

import { useState } from 'react';
import Link from 'next/link';
import PayWithRazorpay from './PayWithRazorpay';

interface UpgradePromptProps {
  resetMs:             number;
  onDismiss:           () => void;
  onPaymentSuccess:    () => void;
  autoTriggerPayment?: boolean;
}

function TimeUntilReset({ resetMs }: { resetMs: number }) {
  const diffMs = Math.max(0, resetMs - Date.now());
  const hours  = Math.floor(diffMs / 3_600_000);
  const mins   = Math.floor((diffMs % 3_600_000) / 60_000);
  return (
    <span className="font-mono text-warning font-semibold">
      {hours}h {mins}m
    </span>
  );
}

export default function UpgradePrompt({ resetMs, onDismiss, onPaymentSuccess, autoTriggerPayment }: UpgradePromptProps) {
  const [payError, setPayError] = useState('');

  function handleSuccess() {
    setPayError('');
    onDismiss();
    onPaymentSuccess();
  }

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-base/80 backdrop-blur-sm" onClick={onDismiss} />

      {/* Sheet — slides up on mobile, centered modal on desktop */}
      <div className="relative w-full max-w-md animate-fade-up">
        {/* Gradient top border */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent to-transparent rounded-t-2xl" />

        <div className="bg-elevated border border-border-bright rounded-2xl overflow-hidden" style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(64,128,255,0.12)' }}>

          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-warning-bg border border-warning-border flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2v4M6 8.5v.5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 className="font-display font-bold text-primary text-lg">Free limit reached</h2>
              </div>
              <p className="text-secondary text-sm">
                Resets in <TimeUntilReset resetMs={resetMs} />
              </p>
            </div>
            <button onClick={onDismiss} className="text-dim hover:text-secondary transition-colors p-1 -mr-1 -mt-1" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 pb-6 space-y-3">
            <p className="text-secondary text-sm leading-relaxed">
              You&apos;ve used your 2 free scores for today. Choose how to continue:
            </p>

            {/* ── Option 1: Pay ₹15 ── */}
            <div className="rounded-xl border border-accent-border bg-accent-glow p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-primary text-sm font-display font-semibold">Score this resume now</p>
                  <p className="text-secondary text-xs mt-0.5">Credit added instantly · Never expires</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-accent font-display font-bold text-xl">₹15</p>
                  <p className="text-dim text-xs">one-time</p>
                </div>
              </div>

              {payError && (
                <div className="mb-3 text-xs text-danger bg-danger-bg border border-danger-border rounded-lg px-3 py-2 flex items-start gap-1.5">
                  <span className="flex-shrink-0 font-bold mt-0.5">⚠</span>
                  <span>{payError}</span>
                </div>
              )}

              <PayWithRazorpay
                onSuccess={handleSuccess}
                onError={(msg) => setPayError(msg)}
                label="Pay ₹15 · Score now"
                autoTrigger={autoTriggerPayment}
                className="w-full py-2.5 rounded-xl bg-accent text-white hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                style={{ boxShadow: '0 4px 20px rgba(64,128,255,0.3)' } as React.CSSProperties}
              />

              <p className="text-center text-xs text-dim mt-2">
                Secured by Razorpay · UPI / Cards / Netbanking
              </p>
            </div>

            {/* ── Option 2: Subscribe ── */}
            <Link
              href="/pricing"
              onClick={onDismiss}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 hover:border-border-bright hover:bg-elevated transition-all group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-primary text-sm font-display font-semibold">Unlimited with Pro or Elite</p>
                  <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full font-display font-bold">Popular</span>
                </div>
                <p className="text-secondary text-xs mt-0.5">
                  AI improvements · Save resumes · Cancel anytime
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="text-primary font-display font-bold text-lg">
                  ₹99<span className="text-xs font-normal text-secondary">/mo</span>
                </p>
                <p className="text-dim text-xs group-hover:text-accent transition-colors">See plans →</p>
              </div>
            </Link>

            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="w-full text-center text-xs text-dim hover:text-secondary transition-colors py-2"
            >
              Wait until reset (<TimeUntilReset resetMs={resetMs} />)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
