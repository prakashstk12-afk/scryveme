'use client';

import { useUser, SignInButton, SignUpButton, SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function AuthButton() {
  const { isSignedIn, isLoaded, user } = useUser();

  if (!isLoaded) {
    return <div className="w-20 h-8 bg-surface rounded-lg animate-pulse" />;
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="hidden sm:flex items-center gap-2 text-xs text-secondary hover:text-primary transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-xs font-display font-bold flex-shrink-0">
            {user.firstName?.[0] ?? user.emailAddresses[0]?.emailAddress[0].toUpperCase()}
          </div>
          <span className="max-w-[100px] truncate">{user.firstName ?? 'Account'}</span>
        </Link>
        <SignOutButton>
          <button className="text-xs text-secondary hover:text-primary border border-border hover:border-border-bright px-3 py-1.5 rounded-lg transition-all font-display">
            Sign out
          </button>
        </SignOutButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <button className="text-xs font-display font-medium text-dim hover:text-secondary px-3 py-1.5 rounded-lg border border-border transition-all">
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="text-xs font-display font-medium text-dim border border-border px-3 py-1.5 rounded-lg hover:text-secondary transition-all">
          Sign up
        </button>
      </SignUpButton>
    </div>
  );
}
