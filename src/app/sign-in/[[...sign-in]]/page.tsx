import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <a href="/" className="font-display font-bold text-2xl text-primary">
          Scyrve<span className="text-accent">Me</span>
        </a>
        <p className="text-secondary text-sm mt-2">Sign in to access your scores and subscription</p>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: 'w-full max-w-sm',
            card: 'bg-elevated border border-border shadow-card rounded-2xl',
            headerTitle: 'text-primary font-display',
            headerSubtitle: 'text-secondary',
            socialButtonsBlockButton:
              'bg-surface border border-border text-primary hover:bg-subtle transition-colors',
            socialButtonsBlockButtonText: 'text-primary font-display font-medium',
            dividerLine: 'bg-border',
            dividerText: 'text-secondary',
            formFieldLabel: 'text-secondary text-xs font-display font-semibold tracking-widest uppercase',
            formFieldInput:
              'bg-surface border-border text-primary placeholder:text-dim focus:border-accent focus:ring-accent/20 rounded-xl',
            formButtonPrimary:
              'bg-accent hover:brightness-110 font-display font-semibold rounded-xl transition-all',
            footerActionLink: 'text-accent hover:text-blue-400',
            identityPreviewText: 'text-primary',
            identityPreviewEditButton: 'text-accent',
          },
        }}
      />
    </div>
  );
}
