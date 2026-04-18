'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

// Razorpay Checkout types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string; backdrop_color?: string };
  modal?: { ondismiss?: () => void; animation?: boolean };
  notes?: Record<string, string>;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

type Status = 'idle' | 'loading-script' | 'creating-order' | 'awaiting-payment' | 'verifying' | 'success' | 'error';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src    = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async  = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

interface PayWithRazorpayProps {
  onSuccess: () => void;
  onError:   (msg: string) => void;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  autoTrigger?: boolean;
}

export default function PayWithRazorpay({
  onSuccess,
  onError,
  className = '',
  style,
  label = 'Pay ₹15 · Score now',
  autoTrigger = false,
}: PayWithRazorpayProps) {
  const { isSignedIn, user } = useUser();
  const router               = useRouter();
  const [status, setStatus]  = useState<Status>('idle');
  const autoFired            = useRef(false);

  const isLoading = status !== 'idle' && status !== 'error' && status !== 'success';

  const notSignedIn = isSignedIn === false;

  const statusLabel: Record<Status, string> = {
    idle:               notSignedIn ? 'Sign in to pay ₹15' : label,
    'loading-script':   'Loading gateway…',
    'creating-order':   'Preparing order…',
    'awaiting-payment': 'Complete payment…',
    verifying:          'Confirming payment…',
    success:            'Payment confirmed ✓',
    error:              notSignedIn ? 'Sign in to pay ₹15' : label,
  };

  const handleClick = useCallback(async () => {
    if (!isSignedIn) {
      sessionStorage.setItem('pendingPayment', 'true');
      router.push('/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setStatus('loading-script');
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setStatus('error');
      onError('Failed to load payment gateway. Check your connection and try again.');
      return;
    }

    // Create order on our server
    setStatus('creating-order');
    let orderId: string, amount: number, currency: string;
    try {
      const res = await fetch('/api/payments/create-order', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        onError(data.error ?? 'Could not create payment order.');
        return;
      }
      ({ orderId, amount, currency } = data);
    } catch {
      setStatus('error');
      onError('Network error. Please try again.');
      return;
    }

    // Open Razorpay Checkout
    setStatus('awaiting-payment');
    const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!rzpKey) {
      setStatus('error');
      onError('Payment gateway not configured. Contact support.');
      return;
    }

    const options: RazorpayOptions = {
      key:         rzpKey,
      amount,
      currency,
      name:        'ScyrveMe',
      description: '1 Resume Score Credit',
      order_id:    orderId,
      prefill: {
        name:  user?.fullName  ?? '',
        email: user?.primaryEmailAddress?.emailAddress ?? '',
      },
      theme: {
        color:           '#4080FF',
        backdrop_color:  'rgba(6, 12, 26, 0.85)',
      },
      modal: {
        animation: true,
        ondismiss: () => setStatus('idle'),
      },
      handler: async (response) => {
        setStatus('verifying');
        try {
          const verifyRes = await fetch('/api/payments/verify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();

          if (!verifyRes.ok) {
            setStatus('error');
            onError(verifyData.error ?? 'Payment verification failed. Contact support@scryveme.in');
            return;
          }

          setStatus('success');
          // Brief success flash before auto-scoring
          setTimeout(() => {
            setStatus('idle');
            onSuccess();
          }, 800);
        } catch {
          setStatus('error');
          onError('Could not verify payment. Email support@scryveme.in with your payment ID.');
        }
      },
    };

    try {
      new window.Razorpay(options).open();
    } catch {
      setStatus('error');
      onError('Failed to open payment window. Try refreshing the page.');
    }
  }, [isSignedIn, router, onError, onSuccess, user]);

  // Auto-trigger payment after returning from sign-in
  useEffect(() => {
    if (autoTrigger && isSignedIn && !autoFired.current) {
      autoFired.current = true;
      sessionStorage.removeItem('pendingPayment');
      setTimeout(() => handleClick(), 400);
    }
  }, [autoTrigger, isSignedIn, handleClick]);

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || status === 'success'}
      className={`relative flex items-center justify-center gap-2 font-display font-semibold text-sm transition-all duration-150 disabled:cursor-not-allowed ${className}`}
      style={style}
    >
      {/* Spinner */}
      {isLoading && (
        <svg className="animate-spin flex-shrink-0" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10" strokeLinecap="round" />
        </svg>
      )}

      {/* Success tick */}
      {status === 'success' && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
          <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      {statusLabel[status]}
    </button>
  );
}
