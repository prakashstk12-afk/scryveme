import OpenAI from 'openai';
import { ScoreRequest, ScoreResponse, ScoreResponseSchema, JOB_ROLE_LABELS } from './schemas';
import { getAIConfig } from './config';

function buildSystemPrompt(jobRole?: string): string {
  const roleContext = jobRole
    ? `You evaluate resumes for: ${JOB_ROLE_LABELS[jobRole as keyof typeof JOB_ROLE_LABELS] || jobRole}`
    : `Auto-detect the target role from the resume and job description context (IT fresher, IT lateral, data science, MBA, or non-tech).`;

  return `You are an expert Indian resume reviewer with deep knowledge of the Indian job market, including:
- Hiring practices at TCS, Infosys, Wipro, HCL, Cognizant, Accenture India
- Product companies: Flipkart, Swiggy, Zomato, Razorpay, BYJU's, Zepto, and funded startups
- Campus placement processes at IITs, NITs, IIMs, and Tier 2/3 engineering colleges
- ATS systems used by Naukri.com, LinkedIn India, Shine.com, and Internshala

${roleContext}

SCORING CRITERIA (each section 0–10):
1. contact: Name, email, phone (Indian mobile preferred), LinkedIn, GitHub (for tech roles), city
2. summary: Objective/summary relevant to Indian hiring context; freshers need this more than laterals
3. skills: Keywords matching Indian JD conventions; product companies prefer depth over breadth
4. experience: STAR format, quantified achievements (% improvement, ₹ values, team sizes)
5. education: University, degree, CGPA/percentage, year, board scores for 10th/12th
6. projects: Essential for freshers; GitHub links valued; mention tech stack and outcomes
7. formatting: Single column ATS-friendly, no tables/columns, no photos

INDIA-SPECIFIC RED FLAGS:
- Photo on resume, father's name, DOB, religion, marital status
- Generic objectives like "To work in a growth-oriented organization"
- Missing GitHub/portfolio for tech roles
- No quantified achievements in experience bullets
- Missing 10th/12th board scores (TCS/Infosys ATS filters on this)

Respond ONLY with a valid JSON object. No markdown, no explanation. Exact structure:
{
  "overall": <0-100>,
  "scores": {
    "contact": <0-10>, "summary": <0-10>, "skills": <0-10>,
    "experience": <0-10>, "education": <0-10>, "projects": <0-10>, "formatting": <0-10>
  },
  "strengths": [<2-4 specific strings — cite exact resume content>],
  "improvements": [<3-5 actionable strings — each must reference specific resume text and say exactly what to change>],
  "india_specific_tips": [<2-3 India-market tips>],
  "ats_verdict": "<Pass|Borderline|Fail>",
  "improved_bullets": [<2-3 rewritten versions of the weakest experience/project bullets — quantified, keyword-rich, action-verb led>],
  "bullet_explanations": [<one sentence each explaining WHY the rewrite is stronger than the original — same order as improved_bullets>],
  "projected_score": <estimated overall score 0-100 if the candidate implements all improvements>
}`;
}

function buildUserPrompt(req: ScoreRequest): string {
  let prompt = `RESUME TEXT:\n${req.resumeText}`;
  if (req.jobDescription?.trim()) {
    prompt += `\n\nTARGET JOB DESCRIPTION:\n${req.jobDescription}

Also include in the JSON:
- "jd_match_percent": <0-100> — how well the resume matches this JD
- "critical_keywords": [<up to 6 JD keywords whose absence will cause ATS rejection or disqualification>]
- "optional_keywords": [<up to 6 JD keywords that strengthen the match but aren't dealbreakers>]`;
  }
  return prompt;
}

export async function scoreResume(req: ScoreRequest): Promise<ScoreResponse> {
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
