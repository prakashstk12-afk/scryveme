import Link from 'next/link';
import AuthButton from './AuthButton';

export default function Header() {
  return (
    <header className="border-b border-border bg-base/95 backdrop-blur-xl sticky top-0 z-50" style={{ boxShadow: '0 1px 0 rgba(64,128,255,0.08), 0 4px 24px rgba(0,0,0,0.4)' }}>
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 12px rgba(64,128,255,0.3)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 4h10M3 8h7M3 12h5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-display font-bold text-xl text-primary tracking-tight">
            scryve<span className="text-accent">Me</span>
          </span>
        </Link>

        {/* Nav + Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/pricing"
            className="hidden sm:block text-xs text-dim transition-colors font-display font-medium"
          >
            Pricing
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-dim">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1.5" y="5.5" width="9" height="5.5" rx="1.25" stroke="currentColor" strokeWidth="1" />
              <path d="M3.5 5.5V3.5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            No data stored
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <span className="inline-flex items-center gap-1.5 bg-success-bg text-success border border-success-border text-xs font-display font-semibold px-3 py-1.5 rounded-full flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            Live
          </span>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
