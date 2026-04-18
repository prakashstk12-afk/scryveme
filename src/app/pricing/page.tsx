'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// ─── Data ─────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'pay_per_use',
    tag: 'FLEXIBLE',
    name: 'Pay as you go',
    monthlyPaise: null,
    annualPaise: null,
    perUse: 15,
    tagline: 'Pay only when you need it. Credits never expire.',
    highlight: false,
    cta: 'Score now →',
    ctaHref: '/',
    ctaStyle: 'secondary' as const,
    features: [
      { label: '1 scored resume per payment', included: true },
      { label: 'Full 7-section score + ATS verdict', included: true },
      { label: 'India-specific tips', included: true },
      { label: 'JD match % (with job description)', included: true },
      { label: 'Basic section improvement tips', included: true },
      { label: 'Credits never expire', included: true },
      { label: 'Save scored resume to account', included: false },
      { label: 'AI-recommended content per section', included: false },
      { label: 'Full AI section rewrites', included: false },
      { label: 'Resume history & comparison', included: false },
    ],
  },
  {
    id: 'free',
    tag: 'STARTER',
    name: 'Free',
    monthlyPaise: 0,
    annualPaise: 0,
    perUse: null,
    tagline: '2 resumes per day. No sign-up required.',
    highlight: false,
    cta: 'Get started free',
    ctaHref: '/',
    ctaStyle: 'secondary' as const,
    features: [
      { label: '2 free scores per day', included: true },
      { label: 'Full 7-section score + ATS verdict', included: true },
      { label: 'India-specific tips', included: true },
      { label: 'JD match % (with job description)', included: true },
      { label: 'Basic section improvement tips', included: false },
      { label: 'Credits never expire', included: false },
      { label: 'Save scored resume to account', included: false },
      { label: 'AI-recommended content per section', included: false },
      { label: 'Full AI section rewrites', included: false },
      { label: 'Resume history & comparison', included: false },
    ],
  },
  {
    id: 'pro',
    tag: 'MOST POPULAR',
    name: 'Pro',
    monthlyPaise: 9900,
    annualPaise: 79900,
    perUse: null,
    tagline: 'Unlimited scoring with detailed AI improvements.',
    highlight: true,
    cta: 'Start Pro',
    ctaHref: '#',
    ctaStyle: 'primary' as const,
    annualSaving: '₹389',
    features: [
      { label: 'Unlimited daily scores', included: true },
      { label: 'Full 7-section score + ATS verdict', included: true },
      { label: 'India-specific tips', included: true },
      { label: 'JD match % (with job description)', included: true },
      { label: 'Detailed section improvement tips', included: true },
      { label: 'AI-recommended content per section', included: true },
      { label: 'Save up to 10 resumes', included: true },
      { label: 'Resume history & version tracking', included: true },
      { label: 'Full AI section rewrites', included: false },
      { label: 'Resume A/B comparison', included: false },
    ],
  },
  {
    id: 'elite',
    tag: 'COMPLETE',
    name: 'Elite',
    monthlyPaise: 19900,
    annualPaise: 149900,
    perUse: null,
    tagline: 'Full AI rewrites and unlimited everything.',
    highlight: false,
    cta: 'Start Elite',
    ctaHref: '#',
    ctaStyle: 'gradient' as const,
    annualSaving: '₹889',
    features: [
      { label: 'Unlimited daily scores', included: true },
      { label: 'Full 7-section score + ATS verdict', included: true },
      { label: 'India-specific tips', included: true },
      { label: 'JD match % (with job description)', included: true },
      { label: 'Detailed section improvement tips', included: true },
      { label: 'AI-recommended content per section', included: true },
      { label: 'Unlimited saved resumes', included: true },
      { label: 'Resume history & version tracking', included: true },
      { label: 'Full AI section rewrites (3 alternatives)', included: true },
      { label: 'Resume A/B comparison', included: true },
    ],
  },
];

const COMPARISON_FEATURES = [
  { label: 'Scores per day',             payPerUse: '1 per ₹15',  free: '2',          pro: 'Unlimited',  elite: 'Unlimited' },
  { label: '7-section score',            payPerUse: true,          free: true,         pro: true,         elite: true },
  { label: 'ATS verdict',                payPerUse: true,          free: true,         pro: true,         elite: true },
  { label: 'India-specific tips',        payPerUse: true,          free: true,         pro: true,         elite: true },
  { label: 'JD match %',                 payPerUse: true,          free: true,         pro: true,         elite: true },
  { label: 'Section improvement tips',   payPerUse: 'Basic',       free: false,        pro: 'Detailed',   elite: 'Detailed' },
  { label: 'AI-recommended content',     payPerUse: false,         free: false,        pro: true,         elite: true },
  { label: 'Full AI section rewrites',   payPerUse: false,         free: false,        pro: false,        elite: '3 alternatives' },
  { label: 'Save scored resumes',        payPerUse: false,         free: false,        pro: 'Up to 10',   elite: 'Unlimited' },
  { label: 'Resume version history',     payPerUse: false,         free: false,        pro: true,         elite: true },
  { label: 'Resume A/B comparison',      payPerUse: false,         free: false,        pro: false,        elite: true },
  { label: 'Credits never expire',       payPerUse: true,          free: false,        pro: false,        elite: false },
  { label: 'Cancel anytime',             payPerUse: false,         free: false,        pro: true,         elite: true },
];

const FAQS = [
  {
    q: 'When do my free daily scores reset?',
    a: 'Free scores reset every day at midnight UTC (5:30 AM IST). You get 2 fresh scores each day, no sign-up needed.',
  },
  {
    q: 'Do pay-per-use credits expire?',
    a: 'Never. Once you purchase credits, they stay in your account forever. Buy 1 credit today, use it 6 months later — no problem.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'All major UPI apps (GPay, PhonePe, Paytm), credit & debit cards, netbanking, and digital wallets — powered by Razorpay.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes, cancel anytime from your dashboard with one click. You keep access until the end of your billing period. No questions asked.',
  },
  {
    q: 'Is my resume data stored on your servers?',
    a: 'For anonymous free users, your resume text is processed in real-time and immediately discarded — nothing is stored. For signed-in Pro/Elite users, saved resumes are stored securely and encrypted.',
  },
  {
    q: 'What is the difference between Pro and Elite?',
    a: 'Pro gives you AI-recommended content suggestions for each section. Elite goes further — it generates full AI rewrites with 3 alternative versions per section, plus A/B resume comparison to see which version scores higher.',
  },
  {
    q: 'Can I switch between plans?',
    a: 'Yes. Upgrade anytime and you get the new tier immediately. Downgrade takes effect at your next billing cycle.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'Yes. Contact us within 7 days of your subscription payment and we\'ll process a full refund, no questions asked. Pay-per-use credits are non-refundable once used.',
  },
];

// ─── Sub-components ────────────────────────────────────────────

function CellValue({ value }: { value: boolean | string }) {
  if (value === true)  return <span className="text-success text-base">✓</span>;
  if (value === false) return <span className="text-dim text-base">—</span>;
  return <span className="text-secondary text-xs font-medium">{value}</span>;
}

function formatPrice(paise: number | null, annual: boolean): string {
  if (paise === null) return '';
  if (paise === 0) return '₹0';
  const rs = annual ? Math.round(paise / 12 / 100) : paise / 100;
  return `₹${rs}`;
}

function PricingCard({ plan, annual }: { plan: typeof PLANS[0]; annual: boolean }) {
  const isGradient = plan.ctaStyle === 'gradient';
  const isPrimary  = plan.ctaStyle === 'primary';
  const isPayPerUse = plan.id === 'pay_per_use';

  const displayPrice = isPayPerUse
    ? `₹${plan.perUse}`
    : formatPrice(annual ? plan.annualPaise : plan.monthlyPaise, annual);

  const billingLabel = isPayPerUse
    ? 'per score'
    : plan.monthlyPaise === 0
      ? 'forever free'
      : annual
        ? '/mo billed annually'
        : '/month';

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200
        ${plan.highlight
          ? 'border-accent bg-elevated'
          : 'border-border bg-elevated hover:border-border-bright'
        }`}
      style={plan.highlight ? { boxShadow: '0 0 40px rgba(64,128,255,0.12), 0 0 0 1px rgba(64,128,255,0.3)' } : {}}
    >
      {/* Popular badge */}
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-accent text-white text-xs font-display font-bold px-4 py-1 rounded-full whitespace-nowrap">
            Most Popular
          </span>
        </div>
      )}

      {/* Tag */}
      <span className="text-xs font-display font-bold tracking-widest text-secondary mb-3 block">
        {plan.tag}
      </span>

      {/* Name */}
      <h3 className={`font-display font-bold text-2xl mb-1 ${plan.highlight ? 'text-primary' : 'text-primary'}`}>
        {plan.name}
      </h3>

      {/* Price */}
      <div className="mb-1">
        <span className={`font-display font-bold text-4xl ${plan.highlight ? 'text-white' : 'text-primary'}`}>
          {displayPrice}
        </span>
        <span className="text-secondary text-sm ml-1.5">{billingLabel}</span>
      </div>

      {/* Annual saving badge */}
      {annual && plan.annualSaving && (
        <div className="mb-3">
          <span className="text-xs bg-success-bg text-success border border-success-border px-2.5 py-1 rounded-full font-display font-semibold">
            Save {plan.annualSaving} vs monthly
          </span>
        </div>
      )}

      <p className="text-secondary text-sm mb-6 leading-relaxed">{plan.tagline}</p>

      {/* CTA */}
      <a
        href={plan.ctaHref}
        className={`w-full text-center text-sm font-display font-semibold py-3 rounded-xl transition-all duration-150 mb-6 block
          ${isGradient
            ? 'text-white'
            : isPrimary
              ? 'btn-primary'
              : 'btn-secondary'
          }`}
        style={isGradient ? {
          background: 'linear-gradient(135deg, #4080FF 0%, #38BDF8 100%)',
          boxShadow: '0 4px 20px rgba(64,128,255,0.3)',
        } : {}}
      >
        {plan.cta}
      </a>

      {/* Feature list */}
      <ul className="space-y-2.5">
        {plan.features.map((f) => (
          <li key={f.label} className={`flex items-start gap-2.5 text-sm ${f.included ? 'text-primary' : 'text-dim'}`}>
            <span className={`flex-shrink-0 mt-0.5 font-bold ${f.included ? 'text-success' : 'text-dim'}`}>
              {f.included ? '✓' : '—'}
            </span>
            {f.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-elevated hover:bg-subtle transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-display font-medium text-primary text-sm">{q}</span>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" stroke="#8096BC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 bg-surface border-t border-border">
          <p className="text-secondary text-sm leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-4 pb-24">

        {/* ── Hero ── */}
        <section className="pt-16 pb-12 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent-glow text-accent text-xs font-display font-semibold px-4 py-1.5 rounded-full mb-6 border border-accent-border">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            Simple, honest pricing · No hidden fees
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary leading-tight mb-4">
            Plans for every step of your<br />
            <span className="gradient-text">career journey</span>
          </h1>
          <p className="text-secondary text-lg leading-relaxed mb-8">
            Start free, score your resume, and upgrade when you need AI-powered improvements. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-surface border border-border p-1 rounded-xl">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-display font-medium transition-all ${
                !annual ? 'bg-elevated text-primary border border-border-bright' : 'text-secondary hover:text-primary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-lg text-sm font-display font-medium transition-all flex items-center gap-2 ${
                annual ? 'bg-elevated text-primary border border-border-bright' : 'text-secondary hover:text-primary'
              }`}
            >
              Annual
              <span className="text-xs bg-success-bg text-success border border-success-border px-2 py-0.5 rounded-full font-bold">
                Save 33%
              </span>
            </button>
          </div>
        </section>

        {/* ── Pricing Cards ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-20">
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} annual={annual} />
          ))}
        </section>

        {/* ── Comparison Table ── */}
        <section className="mb-20">
          <h2 className="font-display font-bold text-2xl text-primary text-center mb-8">
            Full feature comparison
          </h2>

          {/* Mobile: card per feature */}
          <div className="sm:hidden space-y-3">
            {COMPARISON_FEATURES.map((f) => (
              <div key={f.label} className="bg-elevated border border-border rounded-xl p-4">
                <p className="text-primary text-sm font-display font-medium mb-3">{f.label}</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { tier: 'Pay/use', val: f.payPerUse },
                    { tier: 'Free',    val: f.free },
                    { tier: 'Pro',     val: f.pro },
                    { tier: 'Elite',   val: f.elite },
                  ].map(({ tier, val }) => (
                    <div key={tier}>
                      <p className="text-xs text-secondary mb-1">{tier}</p>
                      <CellValue value={val} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: full table */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-6 py-4 text-xs font-display font-semibold tracking-widest uppercase text-secondary w-[40%]">
                    Feature
                  </th>
                  {['Pay as you go', 'Free', 'Pro', 'Elite'].map((h) => (
                    <th key={h} className="px-4 py-4 text-center">
                      <span className={`text-sm font-display font-bold ${h === 'Pro' ? 'text-accent' : 'text-primary'}`}>
                        {h}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((f, i) => (
                  <tr
                    key={f.label}
                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-elevated' : 'bg-surface'}`}
                  >
                    <td className="px-6 py-3.5 text-sm text-primary">{f.label}</td>
                    <td className="px-4 py-3.5 text-center"><CellValue value={f.payPerUse} /></td>
                    <td className="px-4 py-3.5 text-center"><CellValue value={f.free} /></td>
                    <td className="px-4 py-3.5 text-center bg-accent-glow"><CellValue value={f.pro} /></td>
                    <td className="px-4 py-3.5 text-center"><CellValue value={f.elite} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Trust Bar ── */}
        <section className="mb-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="9" width="16" height="11" rx="2" stroke="#10D98A" strokeWidth="1.5" />
                    <path d="M7 9V6a4 4 0 018 0v3" stroke="#10D98A" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                title: 'Secure payments',
                sub: 'Powered by Razorpay',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 3L19 7v5c0 4.5-3.5 8.5-8 9.5C6.5 20.5 3 16.5 3 12V7l8-4z" stroke="#4080FF" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M8 11l2.5 2.5L14 9" stroke="#4080FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: 'Cancel anytime',
                sub: 'No lock-in contracts',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="#F59E0B" strokeWidth="1.5" />
                    <path d="M11 7v4.5l3 3" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                title: 'No hidden fees',
                sub: 'Price is price. Always.',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 3C6.58 3 3 6.58 3 11s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8z" stroke="#8096BC" strokeWidth="1.5" />
                    <path d="M11 7v4h4" stroke="#8096BC" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                title: '7-day refund',
                sub: 'Not happy? Full refund.',
              },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="flex flex-col items-center text-center bg-elevated border border-border rounded-2xl p-5 gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center">
                  {icon}
                </div>
                <div>
                  <p className="font-display font-semibold text-primary text-sm">{title}</p>
                  <p className="text-secondary text-xs mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-2xl mx-auto mb-20">
          <h2 className="font-display font-bold text-2xl text-primary text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="text-center max-w-xl mx-auto">
          <div className="bg-elevated border border-border-bright rounded-2xl p-8 sm:p-10" style={{ boxShadow: '0 0 60px rgba(64,128,255,0.06)' }}>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-primary mb-3">
              Still deciding?
            </h2>
            <p className="text-secondary text-base mb-7 leading-relaxed">
              Start with the free tier — no sign-up needed. Upgrade only when you&apos;re ready to get the full AI improvement experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/" className="btn-primary px-8 py-3 text-sm text-center">
                Score my resume free →
              </Link>
              <Link href="/#" className="btn-secondary px-8 py-3 text-sm text-center">
                View Pro plan
              </Link>
            </div>
            <p className="text-xs text-dim mt-5">
              No credit card required for free tier · Payments via Razorpay · Cancel Pro/Elite anytime
            </p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
