'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import type { ScoreResponse } from '@/lib/schemas';
import { JOB_ROLE_LABELS, JOB_ROLES, MAX_FILE_SIZE } from '@/lib/schemas';
import ScoreResults from '@/components/ScoreResults';
import DropZone from '@/components/DropZone';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import UpgradePrompt from '@/components/UpgradePrompt';
import { getFingerprint } from '@/lib/fingerprint';

type Step = 'input' | 'loading' | 'results';

export default function HomePage() {
  const { isSignedIn }                = useUser();
  const [step, setStep]               = useState<Step>('input');
  const [resumeText, setResumeText]   = useState('');
  const [jobRole, setJobRole]         = useState<string>('it_fresher');
  const [jobDescription, setJobDescription] = useState('');
  const [inputMode, setInputMode]     = useState<'upload' | 'paste'>('upload');
  const [fileName, setFileName]       = useState('');
  const [error, setError]             = useState('');
  const [result, setResult]           = useState<ScoreResponse | null>(null);
  const [remaining, setRemaining]     = useState<number | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [resetMs, setResetMs]         = useState(0);
  const [autoTriggerPayment, setAutoTriggerPayment] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // After returning from sign-in, auto-show upgrade prompt and trigger payment
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

  async function handleSubmit() {
    setError('');
    const text = resumeText.trim();
    if (text.length < 100) {
      setError('Please provide more resume content — it seems too short.');
      return;
    }

    setStep('loading');

    try {
      // Get browser fingerprint for dual rate-limit check
      const fp = await getFingerprint();

      const res = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(fp ? { 'X-Fingerprint': fp } : {}),
        },
        body: JSON.stringify({
          resumeText: text,
          jobRole,
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
        <section className="pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-accent-glow text-accent text-xs font-display font-semibold px-4 py-1.5 rounded-full mb-7 border border-accent-border">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            Free · No sign-up · Built for India
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-bold leading-tight mb-5">
            <span className="text-primary">Is your resume</span>
            <br />
            <span className="gradient-text">job-market ready?</span>
          </h1>

          <p className="font-body text-secondary text-lg max-w-xl mx-auto leading-relaxed mb-8">
            AI-powered resume scoring tailored to Indian hiring — Naukri, LinkedIn India, campus
            placements, TCS, Infosys, startups, and more.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {['ATS compatibility check', 'India-specific tips', 'Results in 30 seconds'].map((label) => (
              <span key={label} className="flex items-center gap-2 bg-surface border border-border text-secondary px-4 py-1.5 rounded-full text-xs">
                <span className="text-success font-bold text-sm">✓</span>
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* Input Form */}
        {step !== 'results' && (
          <section className="card-glow mb-6">
            {/* Job Role */}
            <div className="mb-6">
              <label className="section-label block mb-3">I am applying for</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {JOB_ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => setJobRole(role)}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-body font-medium transition-all duration-150 text-left
                      ${jobRole === role
                        ? 'bg-accent text-white border-accent-border'
                        : 'bg-surface text-secondary border-border hover:border-border-bright hover:text-primary hover:bg-subtle'
                      }`}
                    style={jobRole === role ? { boxShadow: '0 4px 16px rgba(64,128,255,0.25)' } : {}}
                  >
                    {JOB_ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            </div>

            {/* Resume Input */}
            <div className="mb-5">
              <label className="section-label block mb-3">Your resume</label>
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
                  placeholder="Paste your resume text here... Works great for scanned PDFs that don't upload correctly."
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
                Job description{' '}
                <span className="normal-case font-normal text-dim">(optional — unlocks JD match %)</span>
              </label>
              <textarea
                className="input-field min-h-[100px] resize-y text-sm"
                placeholder="Paste the job description you're targeting for a personalised match score..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                maxLength={3000}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-danger-bg border border-danger-border text-danger rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5 font-bold">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={step === 'loading' || !resumeText.trim()}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9h12M9 3l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Score my resume
            </button>

            {/* Rate limit counter */}
            {remaining !== null && remaining >= 0 && (
              <p className="text-xs text-dim text-center mt-3 flex items-center justify-center gap-1.5">
                <span className={remaining > 0 ? 'text-success' : 'text-warning'}>●</span>
                {remaining} free score{remaining !== 1 ? 's' : ''} remaining today ·{' '}
                <a href="/pricing" className="text-accent hover:underline">Upgrade for unlimited</a>
              </p>
            )}

            {/* Trust row */}
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
          <div className="card-glow flex flex-col items-center py-20 gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-accent-glow border border-accent-border flex items-center justify-center mb-1">
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-accent rounded-full dot-1" />
                <div className="w-2 h-2 bg-accent rounded-full dot-2" />
                <div className="w-2 h-2 bg-accent rounded-full dot-3" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-primary text-xl">Analysing your resume…</p>
              <p className="text-sm text-secondary mt-2">
                Checking ATS compatibility · Scoring 7 sections · Finding India-specific tips
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {['ATS Check', 'Section Scoring', 'India Tips', 'JD Matching'].map((tag) => (
                <span key={tag} className="text-xs text-dim bg-surface border border-border px-3 py-1.5 rounded-full shimmer-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {step === 'results' && result && (
          <div ref={resultRef}>
            <ScoreResults result={result} jobRole={jobRole} onReset={handleReset} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
