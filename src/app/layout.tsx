import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'ScyrveMe — Free AI Resume Scorer for Indian Job Seekers',
  description:
    'Get your resume scored instantly by AI trained on Indian hiring standards. No sign-up needed. Optimised for Naukri, LinkedIn India, campus placements, and IT companies.',
  keywords:
    'resume scorer india, free ats resume checker, naukri resume score, fresher resume tips india, resume review india',
  authors: [{ name: 'ScyrveMe' }],
  openGraph: {
    title: 'ScyrveMe — Free AI Resume Scorer',
    description: 'Score your resume in 30 seconds. Built for the Indian job market.',
    url: 'https://scryveme.in',
    siteName: 'ScyrveMe',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScyrveMe — Free AI Resume Scorer',
    description: 'Score your resume in 30 seconds. Built for the Indian job market.',
  },
  robots: { index: true, follow: true },
  metadataBase: new URL('https://scryveme.in'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en-IN">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="font-body bg-base text-primary antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
