'use client';

import type { ScoreResponse } from '@/lib/schemas';
import { JOB_ROLE_LABELS } from '@/lib/schemas';

interface ScoreResultsProps {
  result: ScoreResponse;
  jobRole: string;
  onReset: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  contact: 'Contact & Links',
  summary: 'Summary / Objective',
  skills: 'Skills Section',
  experience: 'Work Experience',
  education: 'Education',
  projects: 'Projects',
  formatting: 'Formatting & ATS',
};

function scoreTextColor(score: number): string {
  if (score >= 7.5) return 'text-success';
  if (score >= 5) return 'text-warning';
  return 'text-danger';
}

function scoreBarColor(score: number): string {
  if (score >= 7.5) return '#10D98A';
  if (score >= 5) return '#F59E0B';
  return '#F06060';
}

function scoreBg(score: number): string {
  if (score >= 7.5) return 'bg-success-bg border-success-border';
  if (score >= 5) return 'bg-warning-bg border-warning-border';
  return 'bg-danger-bg border-danger-border';
}

function ringColor(score: number): string {
  if (score >= 70) return '#10D98A';
  if (score >= 50) return '#F59E0B';
  return '#F06060';
}

function ringGlow(score: number): string {
  if (score >= 70) return 'rgba(16, 217, 138, 0.15)';
  if (score >= 50) return 'rgba(245, 158, 11, 0.15)';
  return 'rgba(240, 96, 96, 0.15)';
}

function overallLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Average';
  if (score >= 35) return 'Needs Work';
  return 'Major Revision';
}

function overallLabelColor(score: number): string {
  if (score >= 70) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-danger';
}

function atsBadgeClass(verdict: string): string {
  if (verdict === 'Pass') return 'bg-success-bg text-success border-success-border';
  if (verdict === 'Borderline') return 'bg-warning-bg text-warning border-warning-border';
  return 'bg-danger-bg text-danger border-danger-border';
}

function atsIcon(verdict: string): string {
  if (verdict === 'Pass') return '✓';
  if (verdict === 'Borderline') return '~';
  return '✗';
}

function buildWhatsAppText(score: number, verdict: string): string {
  const text = `I just scored ${score}/100 on ScyrveMe's free AI resume checker! 🎯\nATS verdict: ${verdict}\n\nTry it free at scryveme.in — built for Indian job seekers 🇮🇳`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

const circumference = 2 * Math.PI * 70;

export default function ScoreResults({ result, jobRole, onReset }: ScoreResultsProps) {
  const { overall, scores, strengths, improvements, india_specific_tips, ats_verdict, jd_match_percent } = result;
  const offset = circumference - (overall / 100) * circumference;

  return (
    <div className="space-y-4">
      {/* Overall Score Card */}
      <div className="card-glow result-card" style={{ animationDelay: '0ms' }}>
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Score Ring */}
          <div className="relative flex-shrink-0">
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-30 pointer-events-none"
              style={{ backgroundColor: ringGlow(overall) }}
            />
            <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
              <circle cx="80" cy="80" r="70" fill="none" stroke="#1C2E4A" strokeWidth="10" />
              <circle
                cx="80" cy="80" r="70"
                fill="none"
                stroke={ringColor(overall)}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                className="score-ring-progress"
                style={{ '--target-offset': offset } as React.CSSProperties}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-bold text-4xl text-primary leading-none">{overall}</span>
              <span className="text-xs text-secondary font-body mt-1">out of 100</span>
            </div>
          </div>

          {/* Score Meta */}
          <div className="flex-1 text-center sm:text-left">
            <div className={`font-display font-bold text-3xl mb-1 ${overallLabelColor(overall)}`}>
              {overallLabel(overall)}
            </div>
            <p className="text-secondary text-sm mb-5">
              Scored for:{' '}
              <span className="text-primary font-medium">
                {JOB_ROLE_LABELS[jobRole as keyof typeof JOB_ROLE_LABELS]}
              </span>
            </p>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className={`tag ${atsBadgeClass(ats_verdict)}`}>
                {atsIcon(ats_verdict)} ATS: {ats_verdict}
              </span>
              {jd_match_percent !== undefined && (
                <span className="tag bg-accent-glow text-accent border-accent-border">
                  ◎ JD Match: {jd_match_percent}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Scores */}
      <div className="card result-card" style={{ animationDelay: '80ms' }}>
        <h2 className="section-label mb-5">Section breakdown</h2>
        <div className="space-y-4">
          {Object.entries(scores).map(([key, val], i) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs font-body text-secondary w-32 flex-shrink-0 truncate">
                {SECTION_LABELS[key] || key}
              </span>
              <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full score-bar"
                  style={{
                    width: `${(val / 10) * 100}%`,
                    backgroundColor: scoreBarColor(val),
                    '--bar-delay': `${i * 90}ms`,
                  } as React.CSSProperties}
                />
              </div>
              <span className={`text-xs font-display font-bold w-9 text-right ${scoreTextColor(val)}`}>
                {val}/10
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div className="card result-card" style={{ animationDelay: '160ms' }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-success-bg border border-success-border flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7L6 11L12 3" stroke="#10D98A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="section-label">What&apos;s working</h2>
        </div>
        <ul className="space-y-2">
          {strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm font-body text-primary p-3 rounded-xl bg-surface border border-border">
              <span className="text-success font-bold flex-shrink-0 mt-0.5">✓</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Improvements */}
      <div className="card result-card" style={{ animationDelay: '240ms' }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-warning-bg border border-warning-border flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 3v4.5M7 9.5v.5" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="section-label">Priority improvements</h2>
        </div>
        <ul className="space-y-2">
          {improvements.map((imp, i) => (
            <li key={i} className={`flex items-start gap-3 text-sm p-3 rounded-xl border ${scoreBg(5 - i * 0.5)}`}>
              <span className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-display font-bold text-secondary">
                {i + 1}
              </span>
              <span className="text-primary">{imp}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* India Tips */}
      <div className="card result-card border-l-4 border-l-accent" style={{ animationDelay: '320ms' }}>
        <div className="flex items-center gap-2.5 mb-4">
          <span className="text-lg leading-none">🇮🇳</span>
          <h2 className="section-label">India market tips</h2>
        </div>
        <ul className="space-y-2">
          {india_specific_tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-3 text-sm font-body text-primary p-3 rounded-xl bg-surface border border-border">
              <span className="text-accent font-bold flex-shrink-0 mt-0.5">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="card result-card" style={{ animationDelay: '400ms' }}>
        <h2 className="section-label mb-4">Share your score</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={buildWhatsAppText(overall, ats_verdict)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-display font-semibold px-5 py-3 rounded-xl hover:bg-[#20BC5A] active:scale-[0.98] transition-all wa-pulse text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Share on WhatsApp
          </a>
          <button onClick={onReset} className="btn-secondary flex-1 text-sm">
            Score another resume
          </button>
        </div>
      </div>
    </div>
  );
}
