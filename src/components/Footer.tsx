export default function Footer() {
  return (
    <footer className="border-t border-border mt-16 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="font-display font-bold text-primary mb-1">
              scryve<span className="text-accent">Me</span>
            </p>
            <p className="text-sm text-secondary font-body">
              Fix your resume. Get shortlisted.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-secondary">
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1.5" y="5.5" width="9" height="5.5" rx="1.25" stroke="currentColor" strokeWidth="1" />
                <path d="M3.5 5.5V3.5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              No data stored
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1.5L10.5 3.5V6C10.5 8.5 8.25 10.75 6 11.25C3.75 10.75 1.5 8.5 1.5 6V3.5L6 1.5Z"
                  stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
              </svg>
              Secure &amp; private
            </span>
            <span>Made with ♥ for India 🇮🇳</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-xs text-dim">
            © {new Date().getFullYear()} scryveMe · Results are AI-generated and for guidance only.
          </p>
        </div>
      </div>
    </footer>
  );
}
