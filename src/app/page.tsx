'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import type { ScoreResponse } from '@/lib/schemas';
import { MAX_FILE_SIZE } from '@/lib/schemas';
import ScoreResults from '@/components/ScoreResults';
import DropZone from '@/components/DropZone';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import UpgradePrompt from '@/components/UpgradePrompt';
import { getFingerprint } from '@/lib/fingerprint';
import { DEMO_RESUME, DEMO_JD, DEMO_RESULT } from '@/data/sampleData';

type Step = 'input' | 'loading' | 'results';

const LOADING_STEPS = [
  'Reading your resume…',
  'Analyzing job description…',
  'Extracting missing keywords…',
  'Generating actionable insights…',
];

function LoadingSteps() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const delays = [900, 1900, 3200];
    const timers = delays.map((d, i) => setTimeout(() => setActive(i + 1), d));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="space-y-3.5 w-full max-w-xs mx-auto">
      {LOADING_STEPS.map((label, i) => {
        const done    = i < active;
        const current = i === active;
        return (
          <div
            key={i}
            className={`flex items-center gap-3 transition-all duration-500 ${i > active ? 'opacity-25' : 'opacity-100'}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
              done    ? 'bg-success'                            :
              current ? 'bg-accent border-2 border-accent/40'  :
              'bg-surface border border-border'
            }`}>
              {done ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5l2.5 2.5 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : current ? (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              ) : null}
            </div>
            <span className={`text-sm font-body ${done || current ? 'text-primary' : 'text-dim'}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const { isSignedIn }                = useUser();
  const [step, setStep]               = useState<Step>('input');
  const [resumeText, setResumeText]   = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [inputMode, setInputMode]     = useState<'upload' | 'paste'>('upload');
  const [fileName, setFileName]       = useState('');
  const [error, setError]             = useState('');
  const [result, setResult]           = useState<ScoreResponse | null>(null);
  const [isDemo, setIsDemo]           = useState(false);
  const [remaining, setRemaining]     = useState<number | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [resetMs, setResetMs]         = useState(0);
  const [autoTriggerPayment, setAutoTriggerPayment] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSignedIn && sessionStorage.getItem('pendingPayment')) {
      setResetMs(Date.now() + 86_400_000);
      setShowUpgrade(true);
      setAutoTriggerPayment(true);
    }
  }, [isSignedIn]);

  const handleFileParsed = useCallback((text: string, name: string) => {
    setResumeText(text);
    setFileName(name);
    setError('');
  }, []);

  const handleFileError = useCallback((msg: string) => {
    setError(msg);
    setResumeText('');
    setFileName('');
  }, []);

  function handleDemo() {
    setIsDemo(true);
    setResult(DEMO_RESULT);
    setStep('results');
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  async function handleSubmit() {
    setError('');
    const text = resumeText.trim();
    if (text.length < 100) {
      setError('Please provide more resume content — it seems too short.');
      return;
    }

    setIsDemo(false);
    setStep('loading');

    try {
      const fp = await getFingerprint();

      const res = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(fp ? { 'X-Fingerprint': fp } : {}),
        },
        body: JSON.stringify({
          resumeText: text,
          jobDescription: jobDescription.trim() || undefined,
        }),
      });

      const rem = res.headers.get('X-RateLimit-Remaining');
      if (rem !== null && rem !== 'unlimited') setRemaining(parseInt(rem));

      const data = await res.json();

      if (res.status === 429) {
        setResetMs(data.reset ?? Date.now() + 86_400_000);
        setShowUpgrade(true);
        setStep('input');
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Scoring failed. Please try again.');

      setResult(data);
      setStep('results');
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
      setStep('input');
    }
  }

  function handleReset() {
    setStep('input');
    setResult(null);
    setIsDemo(false);
    setResumeText('');
    setFileName('');
    setJobDescription('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen">
      <Header />

      {showUpgrade && (
        <UpgradePrompt
          resetMs={resetMs}
          onDismiss={() => { setShowUpgrade(false); setAutoTriggerPayment(false); }}
          autoTriggerPayment={autoTriggerPayment}
          onPaymentSuccess={async () => {
            setShowUpgrade(false);
            setAutoTriggerPayment(false);
            await handleSubmit();
          }}
        />
      )}

      <main className="max-w-3xl mx-auto px-4 pb-24">

        {/* Hero */}
        <section className="pt-14 pb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-accent-glow text-accent text-xs font-display font-semibold px-4 py-1.5 rounded-full mb-6 border border-accent-border">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            Free · No sign-up required · Built for India
          </div>

          <h1 className="font-display text-[2rem] sm:text-5xl font-bold leading-tight mb-4 px-2">
            <span className="text-primary">See why your resume </span>
            <span className="gradient-text">is getting rejected</span>
          </h1>

          <p className="font-body text-secondary text-base sm:text-lg max-w-lg mx-auto leading-relaxed mb-6">
            Get a match score in 30 seconds. Fix your resume instantly with AI-powered feedback tailored to Indian hiring — Naukri, TCS, Infosys, startups, and more.
          </p>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {[
              '✓ ATS compatibility check',
              '✓ Missing keyword analysis',
              '✓ AI-rewritten bullet points',
            ].map((label) => (
              <span key={label} className="bg-surface border border-border text-secondary px-3 py-1 rounded-full text-xs font-body">
                {label}
              </span>
            ))}
          </div>

          {/* Demo CTA */}
          <button
            onClick={handleDemo}
            className="inline-flex items-center gap-2 text-sm font-display font-semibold text-accent border border-accent-border bg-accent-glow px-5 py-2.5 rounded-xl hover:brightness-110 transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M3 7.5L6.5 11L12 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Try with a sample resume — see results instantly
          </button>

          <p className="text-xs text-dim mt-3">Used by students and professionals across India · No data stored</p>
        </section>

        {/* Input Form */}
        {step !== 'results' && (
          <section className="card-glow mb-6">

            {/* Resume Input */}
            <div className="mb-5">
              <label className="section-label block mb-3">Upload your resume</label>
              <div className="flex gap-1 mb-4 p-1 bg-surface rounded-xl border border-border">
                {(['upload', 'paste'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setInputMode(mode)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-display font-medium transition-all duration-150
                      ${inputMode === mode
                        ? 'bg-elevated text-primary border border-border-bright'
                        : 'text-secondary hover:text-primary'
                      }`}
                  >
                    {mode === 'upload' ? '↑  Upload PDF' : '✎  Paste text'}
                  </button>
                ))}
              </div>

              {inputMode === 'upload' ? (
                <DropZone onParsed={handleFileParsed} onError={handleFileError} fileName={fileName} maxSize={MAX_FILE_SIZE} />
              ) : (
                <textarea
                  className="input-field min-h-[220px] resize-y font-mono text-sm"
                  placeholder="Paste your resume text here…"
                  value={resumeText}
                  onChange={(e) => { setResumeText(e.target.value); setError(''); }}
                  maxLength={15000}
                />
              )}
              {inputMode === 'paste' && resumeText && (
                <p className="text-xs text-dim mt-1.5 text-right">
                  {resumeText.trim().split(/\s+/).length} words
                </p>
              )}
            </div>

            {/* JD */}
            <div className="mb-6">
              <label className="section-label block mb-2">
                Paste the job description{' '}
                <span className="normal-case font-normal text-dim">(optional — unlocks JD match % + missing keywords)</span>
              </label>
              <textarea
                className="input-field min-h-[110px] resize-y text-sm"
                placeholder="Paste the job description you're targeting… The AI will tell you exactly which keywords are missing from your resume."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                maxLength={3000}
              />
            </div>

            {error && (
              <div className="mb-4 bg-danger-bg border border-danger-border text-danger rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5 font-bold">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={step === 'loading' || !resumeText.trim()}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9h12M9 3l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Analyse my resume
            </button>

            {remaining !== null && remaining >= 0 && (
              <p className="text-xs text-dim text-center mt-3 flex items-center justify-center gap-1.5">
                <span className={remaining > 0 ? 'text-success' : 'text-warning'}>●</span>
                {remaining} free score{remaining !== 1 ? 's' : ''} remaining today ·{' '}
                <a href="/pricing" className="text-accent hover:underline">Upgrade for unlimited</a>
              </p>
            )}

            <div className="mt-5 pt-5 border-t border-border flex flex-wrap items-center justify-center gap-5 text-xs text-dim">
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1.5" y="5.5" width="9" height="5.5" rx="1.25" stroke="currentColor" strokeWidth="1" />
                  <path d="M3.5 5.5V3.5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
                Resume never stored
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1.5L10.5 3.5V6C10.5 8.5 8.25 10.75 6 11.25C3.75 10.75 1.5 8.5 1.5 6V3.5L6 1.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                </svg>
                Secure &amp; private
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" />
                  <path d="M6 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
                ~30s analysis
              </span>
            </div>
          </section>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <div className="card-glow flex flex-col items-center py-16 gap-8 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-accent-glow border border-accent-border flex items-center justify-center">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-accent rounded-full dot-1" />
                <div className="w-1.5 h-1.5 bg-accent rounded-full dot-2" />
                <div className="w-1.5 h-1.5 bg-accent rounded-full dot-3" />
              </div>
            </div>
            <div className="text-center mb-2">
              <p className="font-display font-semibold text-primary text-xl mb-1">Analysing your resume…</p>
              <p className="text-sm text-secondary">This takes about 20–30 seconds</p>
            </div>
            <LoadingSteps />
          </div>
        )}

        {/* Results */}
        {step === 'results' && result && (
          <div ref={resultRef}>
            <ScoreResults result={result} isDemo={isDemo} onReset={handleReset} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
