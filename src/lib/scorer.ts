import OpenAI from 'openai';
import { ScoreRequest, ScoreResponse, ScoreResponseSchema, JOB_ROLE_LABELS } from './schemas';
import { getAIConfig } from './config';

function buildSystemPrompt(jobRole: string): string {
  return `You are an expert Indian resume reviewer with deep knowledge of the Indian job market, including:
- Hiring practices at TCS, Infosys, Wipro, HCL, Cognizant, Accenture India
- Product companies: Flipkart, Swiggy, Zomato, Razorpay, BYJU's, Zepto, and funded startups
- Campus placement processes at IITs, NITs, IIMs, and Tier 2/3 engineering colleges
- ATS systems used by Naukri.com, LinkedIn India, Shine.com, and Internshala

You evaluate resumes submitted for: ${JOB_ROLE_LABELS[jobRole as keyof typeof JOB_ROLE_LABELS] || jobRole}

SCORING CRITERIA (each section 0–10):
1. contact: Name, email, phone (Indian mobile preferred), LinkedIn, GitHub (for tech roles), city
2. summary: Objective/summary relevant to Indian hiring context; freshers need this more than laterals
3. skills: Keywords matching Indian JD conventions; TCS uses skills grids; product companies prefer depth over breadth
4. experience: STAR format, quantified achievements (Indian hiring managers love % improvement, ₹ values, team sizes)
5. education: University name, degree, CGPA/percentage (Indian employers care deeply about this), year of passing, board for 10th/12th
6. projects: Essential for freshers; GitHub links valued; college projects should mention tech stack and outcomes
7. formatting: Single column ATS-friendly, consistent fonts, no tables/columns that break parsing, no photos (illegal to require but common)

INDIA-SPECIFIC RED FLAGS TO CHECK:
- Photo on resume (advise against — modern practice)
- Father's name, DOB, religion, marital status (outdated, advise removal)
- Fake/inflated CGPA (common issue — be direct if scores seem inconsistent)
- Generic objectives like "To work in a growth-oriented organization"
- Too many soft skills listed without evidence
- Missing GitHub/portfolio for tech roles
- Spelling errors in company/college names

Respond ONLY with a valid JSON object. No markdown, no explanation, no preamble. Exact structure:
{
  "overall": <number 0-100>,
  "scores": {
    "contact": <0-10>,
    "summary": <0-10>,
    "skills": <0-10>,
    "experience": <0-10>,
    "education": <0-10>,
    "projects": <0-10>,
    "formatting": <0-10>
  },
  "strengths": [<2-4 specific, actionable strings>],
  "improvements": [<3-5 specific, actionable strings>],
  "india_specific_tips": [<2-3 India-market-specific tips>],
  "ats_verdict": "<Pass|Borderline|Fail>"
}`;
}

function buildUserPrompt(req: ScoreRequest): string {
  let prompt = `RESUME TEXT:\n${req.resumeText}`;
  if (req.jobDescription?.trim()) {
    prompt += `\n\nTARGET JOB DESCRIPTION:\n${req.jobDescription}\n\nAlso include "jd_match_percent": <0-100> in the JSON to indicate how well the resume matches this JD.`;
  }
  return prompt;
}

export async function scoreResume(req: ScoreRequest): Promise<ScoreResponse> {
  // Model config is admin-controlled via Supabase → cached in Redis (5 min TTL)
  // Change model/temp/tokens from admin panel without any code deployment
  const modelConfig = await getAIConfig();

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
    maxRetries: 2,
  });

  const completion = await client.chat.completions.create({
    model: modelConfig.name,
    temperature: modelConfig.temperature,
    max_tokens: modelConfig.max_tokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSystemPrompt(req.jobRole) },
      { role: 'user', content: buildUserPrompt(req) },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('No response from AI');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON from AI');
  }

  const result = ScoreResponseSchema.safeParse(parsed);
  if (!result.success) {
    console.error('[Scorer] Schema validation failed:', result.error.issues);
    throw new Error('AI response did not match expected format');
  }

  return result.data;
}
