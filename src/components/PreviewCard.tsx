import React from 'react';
import type { ScoreResponse } from '@/lib/schemas';

// Static sample data — always shown as a preview, not live results
const SAMPLE_SCORE = 62;
const SAMPLE_KEYWORDS = ['cloud computing', 'react', 'aws'];
const SAMPLE_FIX = 'Add measurable impact to each role — numbers get past ATS filters.';

export default function PreviewCard({ result }: { result?: Partial<ScoreResponse> }) {
  void result; // prop kept for API compat; preview always shows static sample

  return (
    <div
      className="max-w-xl mx-auto mt-6 rounded-2xl border border-border bg-surface/60 backdrop-blur-sm overflow-hidden"
      style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(64,128,255,0.06)' }}
    >
      {/* Heading */}
      <div className="px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
        <p className="text-sm font-display font-semibold text-primary">Here&apos;s how scryveMe improves your resume in 30 seconds</p>
        <span className="text-xs text-dim bg-elevated border border-border rounded-full px-2.5 py-0.5">Example result</span>
      </div>

      {/* Body */}
      <div className="p-4 flex items-start gap-5">

        {/* Score ring */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-elevated border border-border">
          <span className="font-display font-bold text-xl text-primary leading-none">{SAMPLE_SCORE}</span>
          <span className="text-[10px] text-dim mt-0.5">/100</span>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {/* Missing keywords */}
          <div>
            <p className="text-xs text-dim font-display font-semibold uppercase tracking-wide mb-1.5">Missing keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_KEYWORDS.map((k) => (
                <span key={k} className="text-xs bg-danger-bg border border-danger-border text-danger px-2.5 py-0.5 rounded-full font-medium">
                  {k}
                </span>
              ))}
            </div>
          </div>

          {/* Single fix suggestion */}
          <div>
            <p className="text-xs text-dim font-display font-semibold uppercase tracking-wide mb-1.5">Top fix</p>
            <p className="text-xs text-secondary leading-relaxed">{SAMPLE_FIX}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
