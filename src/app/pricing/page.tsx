'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// ─── Data ─────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'free',
    tag: 'STARTER',
    name: 'Free',
    price: '₹0',
    priceLabel: 'forever free',
    tagline: 'Try before you commit. No sign-up needed.',
    highlight: false,
    cta: 'Start free',
    ctaHref: '/',
    ctaStyle: 'secondary' as const,
    features: [
      'See your ATS score instantly',
      'Understand why your resume gets rejected',
      'JD match score with your job description',
      'Section-by-section breakdown',
      '2 resumes per day',
    ],
  },
  {
    id: 'pay_per_use',
    tag: 'MOST POPULAR',
    name: 'Pay per use',
    price: '₹19',
    priceLabel: 'per resume',
    tagline: 'Full analysis, one-time payment. No subscription ever.',
    highlight: true,
    cta: 'Score my resume',
    ctaHref: '/',
    ctaStyle: 'primary' as const,
    features: [
      'See exactly why your resume gets rejected',
      'Improve your chances of getting shortlisted',
      'Detailed improvement tips for every section',
      'JD match score with keyword gaps',
      'India-specific ATS insights',
      'Credits never expire — use anytime',
    ],
  },
  {
    id: 'premium',
    tag: 'JOB-READY',
    name: 'Premium',
    price: '₹99',
    priceLabel: 'per resume',
    tagline: 'Walk away with a resume that gets you interviews.',
    highlight: false,
    cta: 'Get job-ready resume',
    ctaHref: '/',
    ctaStyle: 'gradient' as const,
    features: [
      'Everything in Pay per use, plus:',
      'Get stronger bullet points that pass ATS filters',
      'AI-rewritten sections with better impact language',
      'Stand out from 100+ applicants for the same role',
      'Downloadable optimized resume (PDF)',
    ],
  },
];

const COMPARISON_FEATURES = [
  { label: 'Scores per day',              free: '2 / day',     payPerUse: '1 per ₹19',  premium: '1 per ₹99' },
  { label: 'Full ATS score',              free: true,          payPerUse: true,          premium: true },
  { label: 'JD match %',                  free: true,          payPerUse: true,          premium: true },
  { label: 'Section improvement tips',    free: true,          payPerUse: true,          premium: true },
  { label: 'India-specific ATS insights', free: true,          payPerUse: true,          premium: true },
  { label: 'AI-improved bullet points',   free: false,         payPerUse: false,         premium: true },
  { label: 'Full AI section rewrites',    free: false,         payPerUse: false,         premium: true },
  { label: 'Downloadable resume (PDF)',   free: false,         payPerUse: false,         premium: true },
  { label: 'Credits never expire',        free: false,         payPerUse: true,          premium: true },
];

const FAQS = [
  {
    q: 'When do my free daily scores reset?',
    a: 'Free scores reset every day at midnight UTC (5:30 AM IST). You get 2 fresh scores each day — no sign-up needed.',
  },
  {
    q: 'Do Pay per use credits expire?',
    a: 'Never. Credits stay in your account forever. Buy today, use it 6 months later — no problem.',
  },
  {
    q: 'What is the difference between Pay per use and Premium?',
    a: 'Pay per use gives you a full score and detailed improvement suggestions. Premium goes further — it rewrites your resume with stronger bullet points, better language, and gives you a downloadable optimized resume ready to send.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'All major UPI apps (GPay, PhonePe, Paytm), credit & debit cards, netbanking, and digital wallets — powered by Razorpay.',
  },
  {
    q: 'Is my resume data stored on your servers?',
    a: 'For anonymous free users, your resume text is processed in real-time and immediately discarded — nothing is stored. Signed-in users\' saved resumes are stored securely and encrypted.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'Yes. Contact us within 7 days of your payment and we\'ll process a full refund, no questions asked. Credits are non-refundable once used.',
  },
];

// ─── Sub-components ────────────────────────────────────────────

function CellValue({ value }: { value: boolean | string }) {
  if (value === true)  return <span className="text-success text-base">✓</span>;
  if (value === false) return <span className="text-dim text-base">—</span>;
  return <span className="text-secondary text-xs font-medium">{value}</span>;
}

function PricingCard({ plan }: { plan: typeof PLANS[0] }) {
  const isGradient  = plan.ctaStyle === 'gradient';
  const isPrimary   = plan.ctaStyle === 'primary';

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
      <h3 className="font-display font-bold text-2xl mb-1 text-primary">
        {plan.name}
      </h3>

      {/* Price */}
      <div className="mb-4">
        <span className={`font-display font-bold text-4xl ${plan.highlight ? 'text-white' : 'text-primary'}`}>
          {plan.price}
        </span>
        <span className="text-secondary text-sm ml-1.5">{plan.priceLabel}</span>
      </div>

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
        } : isPrimary ? {
          boxShadow: '0 4px 16px rgba(64,128,255,0.25)',
        } : {}}
      >
        {plan.cta}
      </a>

      {/* Feature list */}
      <ul className="space-y-2.5">
        {plan.features.map((label) => {
          const isNote = label.endsWith(':');
          return (
            <li key={label} className={`flex items-start gap-2.5 text-sm ${isNote ? 'text-secondary font-medium' : 'text-primary'}`}>
              {!isNote && (
                <span className="flex-shrink-0 mt-0.5 font-bold text-success">✓</span>
              )}
              {label}
            </li>
          );
        })}
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
  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-5xl mx-auto px-4 pb-24">

        {/* ── Hero ── */}
        <section className="pt-16 pb-12 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent-glow text-accent text-xs font-display font-semibold px-4 py-1.5 rounded-full mb-6 border border-accent-border">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            Simple pricing · No subscriptions
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary leading-tight mb-4">
            Pay only when<br />
            <span className="gradient-text">you need it</span>
          </h1>
          <p className="text-secondary text-lg leading-relaxed">
            Start free. Score your resume. Upgrade when you want a job-ready version.
          </p>
        </section>

        {/* ── Pricing Cards ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-4">
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </section>

        {/* Trust line */}
        <p className="text-center text-xs text-dim mb-20">
          No subscription required · Pay only when you need · Powered by Razorpay
        </p>

        {/* ── Comparison Table ── */}
        <section className="mb-20">
          <h2 className="font-display font-bold text-2xl text-primary text-center mb-8">
            What&apos;s included
          </h2>

          {/* Mobile: card per feature */}
          <div className="sm:hidden space-y-3">
            {COMPARISON_FEATURES.map((f) => (
              <div key={f.label} className="bg-elevated border border-border rounded-xl p-4">
                <p className="text-primary text-sm font-display font-medium mb-3">{f.label}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { tier: 'Free',       val: f.free },
                    { tier: 'Pay/use',    val: f.payPerUse },
                    { tier: 'Premium',    val: f.premium },
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
                  {['Free', 'Pay per use', 'Premium'].map((h) => (
                    <th key={h} className="px-4 py-4 text-center">
                      <span className={`text-sm font-display font-bold ${h === 'Pay per use' ? 'text-accent' : 'text-primary'}`}>
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
                    <td className="px-4 py-3.5 text-center"><CellValue value={f.free} /></td>
                    <td className="px-4 py-3.5 text-center bg-accent-glow"><CellValue value={f.payPerUse} /></td>
                    <td className="px-4 py-3.5 text-center"><CellValue value={f.premium} /></td>
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
                title: 'No subscription',
                sub: 'Pay only when you need',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="#F59E0B" strokeWidth="1.5" />
                    <path d="M11 7v4.5l3 3" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                title: 'Credits never expire',
                sub: 'Buy now, use anytime',
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
              Not sure where to start?
            </h2>
            <p className="text-secondary text-base mb-7 leading-relaxed">
              Try it free — no sign-up needed. See your score in under 30 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/" className="btn-primary px-8 py-3 text-sm text-center">
                Score my resume free →
              </Link>
              <Link href="#" className="btn-secondary px-8 py-3 text-sm text-center">
                See full analysis — ₹19
              </Link>
            </div>
            <p className="text-xs text-dim mt-5">
              No credit card required · No subscription · Pay only when you need
            </p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
