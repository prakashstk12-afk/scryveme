import type { ScoreResponse } from '@/lib/schemas';

export const DEMO_RESUME = `Rahul Sharma
rahul.sharma@gmail.com | +91 98765 43210
LinkedIn: linkedin.com/in/rahulsharma | GitHub: github.com/rahulsharma
Hyderabad, Telangana

OBJECTIVE
To work in a growth-oriented organization where I can utilize my technical skills.

EDUCATION
B.Tech Computer Science Engineering
JNTU Hyderabad | 2020 – 2024 | CGPA: 7.8/10

TECHNICAL SKILLS
Languages: Java, Python, JavaScript, HTML, CSS
Database: MySQL, MongoDB
Tools: Git, VS Code, Eclipse
Frameworks: Basic React.js

INTERNSHIP
Web Developer Intern | StartupXYZ, Hyderabad | June 2023 – Aug 2023
• Worked on frontend tasks using HTML, CSS, JavaScript
• Fixed bugs in the existing application
• Collaborated with team members on various features

PROJECTS
Library Management System (Jan 2024)
• Built using Java and MySQL
• Implemented CRUD operations
• Added user authentication

Personal Portfolio Website (Sep 2023)
• Created using HTML, CSS, JavaScript
• Responsive design

ACHIEVEMENTS
• Participated in college level hackathon (2023)
• Completed online Java certification course`;

export const DEMO_JD = `Software Engineer – Java Backend
TechCorp India Pvt. Ltd. | Hyderabad | 0–2 Years Experience

We are looking for a passionate Java Backend Developer to join our engineering team.

Requirements:
• Strong proficiency in Core Java and Spring Boot
• Experience building RESTful APIs and microservices
• Database: MySQL or PostgreSQL
• Familiarity with Git, Maven, and CI/CD pipelines
• Understanding of Agile/Scrum methodology
• Docker knowledge is a plus
• JUnit testing experience preferred
• Good problem-solving and communication skills

Responsibilities:
• Design and develop backend services using Java/Spring Boot
• Write clean, testable code
• Collaborate with frontend team on API contracts
• Participate in code reviews and sprint planning`;

// Pre-generated demo result — instant, no API call needed
export const DEMO_RESULT: ScoreResponse = {
  overall: 62,
  scores: {
    contact: 7,
    summary: 3,
    skills: 6,
    experience: 5,
    education: 8,
    projects: 5,
    formatting: 7,
  },
  strengths: [
    'Strong CGPA of 7.8 — Indian campus recruiters at TCS, Infosys, Wipro filter on a 60% threshold; you clear it comfortably',
    'GitHub profile linked alongside LinkedIn — product companies and startups value this and it sets you apart from 80% of applicants',
    'Internship at a real company shows practical exposure; even 2 months of industry experience outweighs three personal projects',
  ],
  improvements: [
    'Objective is generic — "To work in a growth-oriented organization" appears in millions of resumes; replace with: "Java Backend Developer | JNTU 2024 | Seeking Spring Boot roles in Hyderabad product companies"',
    'Experience bullets have zero numbers — "Worked on frontend tasks" tells recruiters nothing; quantify: "Built 4 UI components in React.js, reducing page render time by 15% across 200+ daily active users"',
    'Spring Boot is completely absent from your skills — it\'s the #1 required skill in 78% of Java job postings on Naukri; add it even if exposure was limited',
    'Projects lack measurable outcomes — "Implemented CRUD operations" is table stakes; add scale: "Supports 50 concurrent users" or "Deployed on AWS EC2"',
    '10th and 12th board scores are missing — Infosys, Wipro, and TCS ATS systems have hard filters for 60%+ in all boards; their systems reject your resume before a human sees it',
  ],
  india_specific_tips: [
    'Register your resume on Naukri.com with keywords "Java Spring Boot Hyderabad" — 93% of Indian recruiters actively source from it; LinkedIn alone misses most opportunities',
    'Add 10th and 12th percentages — not optional for mass recruiters; even for startups, many HR tools still use Naukri\'s ATS which filters on this',
    'Do not add a photo — modern Indian tech companies follow international standards and a photo can introduce unconscious bias that hurts your chances',
  ],
  ats_verdict: 'Borderline',
  jd_match_percent: 54,
  missing_keywords: [
    'Spring Boot', 'REST API', 'Microservices', 'Agile', 'JUnit',
    'Maven', 'Docker', 'PostgreSQL', 'CI/CD', 'System Design',
  ],
  critical_keywords: ['Spring Boot', 'REST API', 'JUnit', 'Maven', 'Agile'],
  optional_keywords: ['Docker', 'PostgreSQL', 'CI/CD', 'Microservices', 'System Design'],
  improved_bullets: [
    'Developed and deployed 4 RESTful API endpoints using Spring Boot, reducing average data fetch time by 30% and handling 500+ daily requests in production',
    'Built Library Management System in Java + MySQL supporting 50 concurrent users with role-based access control (admin/student) and session management',
    'Completed 3-month internship at StartupXYZ independently resolving 12 critical frontend bugs and improving Lighthouse performance score from 54 to 78',
  ],
  bullet_explanations: [
    'Added Spring Boot (critical JD keyword), quantified with 4 endpoints + 30% improvement + 500 daily requests — turns a vague task into a measurable achievement',
    'Added user scale (50 concurrent users), specific features (role-based access), and outcomes — shows system complexity instead of just listing technologies',
    'Quantified with 12 bugs + specific metric (Lighthouse score 54→78) — transforms "worked on bugs" into a clear performance improvement with before/after data',
  ],
  projected_score: 79,
};
