# scryveMe — AI Resume Scorer for India

Free, no-login AI resume scorer built for the Indian job market.

## Features
- PDF upload + text paste fallback
- India-specific scoring (Naukri, LinkedIn India, campus placements)
- ATS compatibility verdict
- Optional JD match percentage
- WhatsApp share button
- Rate limiting (5 scores/IP/day)
- Full security hardening

## Stack
- Next.js 14 (App Router)
- OpenAI GPT-4o mini
- Upstash Redis (rate limiting)
- Vercel (hosting)
- Tailwind CSS

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env.local
```

Fill in:
- `OPENAI_API_KEY` — from https://platform.openai.com
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — from https://console.upstash.com (free tier)

### 3. Run locally
```bash
npm run dev
```

Open http://localhost:3000

### 4. Deploy to Vercel
```bash
npx vercel deploy
```

Set environment variables in Vercel dashboard → Settings → Environment Variables.

Then point your `scryveme.in` domain to Vercel in your DNS settings (add a CNAME record).

## Security features
- HTTP security headers (CSP, HSTS, X-Frame-Options)
- Bot/scraper detection in middleware
- IP-based rate limiting via Upstash Redis
- Input sanitization and prompt injection detection
- Zod schema validation on all inputs
- Body size limits
- No user data stored

## Cost estimate
- Vercel: Free tier
- OpenAI GPT-4o mini: ~₹0.05 per resume scored
- Upstash Redis: Free tier (10,000 requests/day)
- Total at 500 users/month: ~₹25/month
