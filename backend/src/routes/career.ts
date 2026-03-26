import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest, authenticateToken, requireRole } from "../middleware/auth";
import { generateWithRetry } from "../lib/ai";

const router = Router();

// Industry benchmarks (now used as prompt context & fallback)
const roleBenchmarks: Record<string, any> = {
    "Full Stack Developer": {
        skills: ["React", "Node.js", "PostgreSQL", "TypeScript", "Docker", "AWS"],
        certs: [{ title: "Meta Full Stack Engineer", platform: "Coursera", icon: "💻", relevance: "Critical", time: "6 Months" }],
        projects: [{ title: "E-Commerce Microservices", description: "A scalable e-commerce platform with decoupled services for payments, inventory, and auth.", skills: ["Node.js", "Docker", "Redis"], impact: "High" }],
        competitions: [{ title: "Smart India Hackathon", type: "National", date: "Annual", difficulty: "Hard", url: "https://www.sih.gov.in/" }]
    },
    "Data Scientist": {
        skills: ["Python", "TensorFlow", "Pandas", "SQL", "Statistics"],
        certs: [{ title: "Google Data Analytics", platform: "Coursera", icon: "📊", relevance: "High", time: "4 Months" }],
        projects: [{ title: "Predictive Health Analytics", description: "ML model to predict patient readmission rates using historical clinical data.", skills: ["Python", "Scikit-Learn", "FastAPI"], impact: "High" }],
        competitions: [{ title: "Kaggle Grand Prix", type: "Global", date: "Quarterly", difficulty: "Hard", url: "https://www.kaggle.com/competitions" }]
    },
    "Backend Developer": {
        skills: ["Java", "Spring Boot", "MySQL", "System Design", "Redis"],
        certs: [{ title: "Spring Certified Professional", platform: "Pivotal", icon: "☕", relevance: "Critical", time: "5 Months" }],
        projects: [{ title: "Real-time Chat Engine", description: "High-throughput messaging system with WebSockets and distributed caching.", skills: ["Java", "Redis", "Kafka"], impact: "High" }],
        competitions: [{ title: "ICPC World Finals", type: "Elite", date: "Annual", difficulty: "Hard", url: "https://icpc.global/" }]
    }
};

// GET /api/career/analysis — Get AI-driven career readiness
router.get("/analysis", authenticateToken, requireRole("STUDENT", "student"), async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.userId;
        const targetGoal = (req.query.goal as string) || "Full Stack Developer";

        const user = await prisma.user.findUnique({
            where: { id: studentId },
            include: {
                student: {
                    include: {
                        skills: { include: { skill: true } },
                        academicRecords: { include: { subject: true } },
                        codingProfiles: true,
                        _count: { select: { badges: true } }
                    }
                }
            }
        });

        if (!user?.student) throw new Error("Student not found");

        const student = user.student;
        const studentSkillNames = student.skills.map(s => s.skill.name);

        const systemPrompt = `You are a world-class Career Strategist and Professional Advisory AI.
Your task is to provide a comprehensive career readiness analysis for the student aiming for the role of "${targetGoal}".

STUDENT CONTEXT:
- Name: ${user.name}
- Academic Performance: ${student.cgpa} CGPA
- Core Academic Records: ${JSON.stringify(student.academicRecords.map(r => ({ subject: r.subject.name, grade: r.grade })))}
- Current Skill Repository: ${studentSkillNames.join(", ")}
- Verified Badges Earned: ${student._count.badges}
- Coding Profiles & Infrastructure: ${JSON.stringify(student.codingProfiles)}

INDUSTRY BENCHMARKS for "${targetGoal}":
${JSON.stringify(roleBenchmarks[targetGoal] || roleBenchmarks["Full Stack Developer"])}

INSTRUCTIONS FOR PLACEMENT SCORE (0-100):
Calculate the "placementScore" using this FINALized weightage:
1. 55% WEIGHT - Coding Profiles: Analyze global platform performance (LeetCode, HackerRank, etc.) and problem-solving metrics.
2. 45% WEIGHT - CS Fundamentals: ONLY consider core academic performance (DSA, OS, DBMS, CNS). STRICTLY IGNORE non-technical subjects.

ADDITIONAL INSTRUCTIONS:
1. Generate a "skillGap" array with EXACTLY 6 technical skills. 
   - Each entry must have "skill" (name), "student" (0-100 proficiency), and "industry" (target 90).
   - Proficiency: 65-95 if in Repository, 15-45 if not.
2. Provide "recommendations":
   - "certifications": 3 high-value certifications (e.g. from AWS, Meta, or Google).
   - "projects": 2 high-impact system architecture projects.
   - "competitions": 2 "Elite Gatherings" with VERIFIED official URLs.
     EXAMPLES OF VERIFIED URLS:
     - Smart India Hackathon: https://www.sih.gov.in/
     - Google Summer of Code: https://summerofcode.withgoogle.com/
     - Major League Hacking: https://mlh.io/seasons/2024/events
     - Codeforces: https://codeforces.com/contests
     - LeetCode: https://leetcode.com/contest/
     - ICPC: https://icpc.global/
     - Microsoft Imagine Cup: https://imaginecup.microsoft.com/
3. Write a professional, data-driven "summary".

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "placementScore": number,
  "skillGap": [
    { "skill": "string", "student": number, "industry": 90 }
  ],
  "recommendations": {
    "certifications": [{ "title": "string", "platform": "string", "relevance": "Critical" | "High", "time": "string", "icon": "string" }],
    "projects": [{ "title": "string", "description": "string", "skills": ["string"], "impact": "High" }],
    "competitions": [{ "title": "string", "type": "Global" | "National" | "Elite", "date": "string", "difficulty": "Hard" | "Medium", "url": "string" }]
  },
  "summary": "string"
}

Ensure all links are the direct official websites. No hallucinations.
Be precise and professional.`;

        console.log(`[Career] Requesting Groq AI Analysis for ${user.name} -> ${targetGoal}`);

        try {
            const result = await generateWithRetry(systemPrompt);
            const responseText = result.choices[0]?.message?.content || "{}";
            const aiData = JSON.parse(responseText);

            console.log(`[Career] Successfully generated AI response for ${studentId}`);
            return res.json(aiData);
        } catch (aiError) {
            console.error("[Career] AI failed, falling back to deterministic logic:", aiError);
            const academicScore = Math.min((student.cgpa / 10) * 100, 100);
            const codingScore = Math.min(student.codingProfiles.length * 20, 100); 
            const placementScore = Math.round((codingScore * 0.55) + (academicScore * 0.45));
            
            const benchmark = roleBenchmarks[targetGoal] || roleBenchmarks["Full Stack Developer"];
            
            return res.json({
                placementScore: Math.min(placementScore, 95),
                skillGap: benchmark.skills.map((s: string) => ({ skill: s, student: 40, industry: 90 })),
                recommendations: { 
                    certifications: benchmark.certs, 
                    projects: benchmark.projects, 
                    competitions: benchmark.competitions 
                },
                summary: "Our AI coach is resting. Here is a basic estimate and industry-standard roadmap based on your current stats."
            });
        }

    } catch (error: any) {
        console.error("[Career] Route error:", error.message);
        return res.status(500).json({ error: "Failed to generate career analysis" });
    }
});

export default router;
