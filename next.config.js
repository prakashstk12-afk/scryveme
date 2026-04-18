/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Clerk CDN + your Clerk instance domain (wildcard covers dev & prod instances)
              // Razorpay checkout script
              // FingerprintJS CDN
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.scryveme.in https://cdn.jsdelivr.net https://checkout.razorpay.com https://fpjscdn.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://checkout.razorpay.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.clerk.com https://img.clerk.com https://checkout.razorpay.com",
              // Clerk API + Supabase + OpenAI + Razorpay API + FingerprintJS
              "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://api.openai.com https://*.supabase.co https://livekit.razorpay.com https://api.razorpay.com https://fpjscdn.net https://*.fpjs.io",
              // Razorpay opens payment iframe
              "frame-src https://api.razorpay.com https://checkout.razorpay.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
