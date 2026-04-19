import { z } from 'zod';

export const JOB_ROLES = [
  'it_fresher',
  'it_lateral',
  'non_tech',
  'mba',
  'data_science',
] as const;

export type JobRole = (typeof JOB_ROLES)[number];

export const JOB_ROLE_LABELS: Record<JobRole, string> = {
  it_fresher: 'IT Fresher / Campus',
  it_lateral: 'IT Lateral (2–8 yrs)',
  non_tech: 'Non-Tech / Operations',
  mba: 'MBA / Management',
  data_science: 'Data Science / AI/ML',
};

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ScoreRequestSchema = z.object({
  resumeText: z
    .string()
    .min(100, 'Resume text is too short — please provide more content')
    .max(15000, 'Resume text is too long — please trim it below 15,000 characters')
    .refine(
      (t) => t.trim().split(/\s+/).length >= 50,
      'Resume must contain at least 50 words'
    ),
  jobRole: z.enum(JOB_ROLES).optional(),
  jobDescription: z
    .string()
    .max(3000, 'Job description must be under 3,000 characters')
    .optional(),
});

export type ScoreRequest = z.infer<typeof ScoreRequestSchema>;

// Score response shape
export const SectionScores = z.object({
  contact: z.number().min(0).max(10),
  summary: z.number().min(0).max(10),
  skills: z.number().min(0).max(10),
  experience: z.number().min(0).max(10),
  education: z.number().min(0).max(10),
  projects: z.number().min(0).max(10),
  formatting: z.number().min(0).max(10),
});

export const ScoreResponseSchema = z.object({
  overall: z.number().min(0).max(100),
  scores: SectionScores,
  strengths: z.array(z.string()).min(1).max(5),
  improvements: z.array(z.string()).min(1).max(6),
  india_specific_tips: z.array(z.string()).min(1).max(4),
  ats_verdict: z.enum(['Pass', 'Borderline', 'Fail']),
  jd_match_percent:    z.number().min(0).max(100).optional(),
  missing_keywords:    z.array(z.string()).max(15).optional(),
  critical_keywords:   z.array(z.string()).max(8).optional(),
  optional_keywords:   z.array(z.string()).max(8).optional(),
  improved_bullets:    z.array(z.string()).max(4).optional(),
  bullet_explanations: z.array(z.string()).max(4).optional(),
  projected_score:     z.number().min(0).max(100).optional(),
});

export type ScoreResponse = z.infer<typeof ScoreResponseSchema>;

// Premium enhancement response — second-pass AI output
export const PremiumResponseSchema = z.object({
  all_improved_bullets:      z.array(z.string()).min(1).max(12),
  all_bullet_explanations:   z.array(z.string()).min(1).max(12),
  section_rewrites: z.object({
    summary:    z.string().optional(),
    skills:     z.string().optional(),
    experience: z.string().optional(),
    projects:   z.string().optional(),
  }),
  key_changes: z.array(z.string()).min(1).max(6),
});

export type PremiumResponse = z.infer<typeof PremiumResponseSchema>;

export { MAX_FILE_SIZE };
