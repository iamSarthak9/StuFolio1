import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest, authenticateToken, requireRole } from "../middleware/auth";
import { generateWithRetry } from "../lib/ai";

const router = Router();

// Industry benchmarks (now used as prompt context & fallback)
const roleBenchmarks: Record<string, any> = {
    "Full Stack Developer": {
        skills: ["React", "Node.js", "PostgreSQL", "TypeScript", "Docker", "AWS"],
        certs: [
            { title: "Meta Full Stack Engineer", platform: "Coursera", icon: "💻", relevance: "Critical", time: "6 Months" },
            { title: "AWS Certified Developer", platform: "Amazon", icon: "☁️", relevance: "High", time: "3 Months" },
            { title: "MongoDB Associate", platform: "MongoDB", icon: "🍃", relevance: "High", time: "2 Months" }
        ],
        projects: [
            { title: "E-Commerce Microservices", description: "Scalable platform with decoupled services for payments, inventory, and auth.", skills: ["Node.js", "Docker", "Redis"], impact: "High" },
            { title: "AI Image SaaS", description: "Multi-tenant art generator using DALL-E 3 with Stripe subscription credits.", skills: ["Next.js", "OpenAI", "Stripe"], impact: "High" },
            { title: "Real-time Collaboration Tool", description: "Shared workspace with live cursor tracking and concurrent editing.", skills: ["Socket.io", "React", "Redis"], impact: "High" }
        ],
        competitions: [
            { title: "Smart India Hackathon", type: "National", date: "Annual", difficulty: "Hard", url: "https://www.sih.gov.in/" },
            { title: "Google Summer of Code", type: "Global", date: "Summer", difficulty: "Elite", url: "https://summerofcode.withgoogle.com/" }
        ]
    },
    "Backend Developer": {
        skills: ["Java", "Spring Boot", "MySQL", "System Design", "Redis", "Kafka"],
        certs: [
            { title: "Spring Certified Professional", platform: "VMware", icon: "🍃", relevance: "Critical", time: "5 Months" },
            { title: "Oracle Java SE Professional", platform: "Oracle", icon: "☕", relevance: "High", time: "4 Months" },
            { title: "CKA (Kubernetes)", platform: "CNCF", icon: "☸️", relevance: "High", time: "3 Months" }
        ],
        projects: [
            { title: "Real-time Chat Engine", description: "High-throughput messaging system with WebSockets and distributed caching.", skills: ["Java", "Redis", "Kafka"], impact: "High" },
            { title: "FinTech Ledger API", description: "Double-entry accounting system with ACID compliance for high-stakes banking.", skills: ["PostgreSQL", "Go", "Docker"], impact: "High" },
            { title: "Distributed Task Scheduler", description: "Job orchestration engine handling 10k+ concurrent background tasks.", skills: ["Python", "Celery", "RabbitMQ"], impact: "High" }
        ],
        competitions: [
            { title: "ICPC World Finals", type: "Elite", date: "Annual", difficulty: "Hard", url: "https://icpc.global/" },
            { title: "LeetCode Weekly Contests", type: "Global", date: "Weekly", difficulty: "Medium", url: "https://leetcode.com/contest/" }
        ]
    },
    "Frontend Developer": {
        skills: ["React", "Vue.js", "Tailwind CSS", "Framer Motion", "Three.js", "Vite"],
        certs: [
            { title: "Meta Front-End Developer", platform: "Coursera", icon: "🎨", relevance: "Critical", time: "6 Months" },
            { title: "Google UX Design", platform: "Coursera", icon: "✨", relevance: "High", time: "6 Months" },
            { title: "AWS Cloud Practitioner", platform: "Amazon", icon: "☁️", relevance: "Medium", time: "2 Months" }
        ],
        projects: [
            { title: "Design System UI Kit", description: "Comprehensive library of accessible React components with Storybook documentation.", skills: ["React", "Storybook", "Radix"], impact: "High" },
            { title: "3D WebGL Portfolio", description: "Immersive 3D experimental portfolio with interactive physics and shader effects.", skills: ["Three.js", "GLSL", "React Three Fiber"], impact: "High" },
            { title: "PWA Dashboard", description: "Offline-first analytics dashboard with advanced caching and push notifications.", skills: ["Next.js", "Workbox", "PWA"], impact: "High" }
        ],
        competitions: [
            { title: "CSS Battle", type: "Global", date: "Continuous", difficulty: "Medium", url: "https://cssbattle.dev/" },
            { title: "Frontend Mentor Challenges", type: "Elite", date: "Project-based", difficulty: "Medium", url: "https://www.frontendmentor.io/" }
        ]
    },
    "Data Scientist": {
        skills: ["Python", "TensorFlow", "Pandas", "Scikit-Learn", "SQL", "Statistics"],
        certs: [
            { title: "Google Data Analytics", platform: "Coursera", icon: "📊", relevance: "High", time: "4 Months" },
            { title: "IBM Data Science Professional", platform: "edX", icon: "🧪", relevance: "High", time: "8 Months" },
            { title: "DeepLearning.ai Specialization", platform: "DeepLearning.ai", icon: "🧠", relevance: "Critical", time: "5 Months" }
        ],
        projects: [
            { title: "Predictive Health Analytics", description: "ML model predicting patient readmission using historical clinical data.", skills: ["Python", "Scikit-Learn", "FastAPI"], impact: "High" },
            { title: "Stock Sentiment AI", description: "Real-time NLP analysis of 1M+ tweets to predict stock market trends.", skills: ["NLP", "PyTorch", "Kafka"], impact: "High" },
            { title: "Customer Segmentation Engine", description: "Clustering 100k+ users for behavior-based marketing strategies.", skills: ["K-Means", "Python", "Tableau"], impact: "High" }
        ],
        competitions: [
            { title: "Kaggle Grand Prix", type: "Global", date: "Bi-Weekly", difficulty: "Hard", url: "https://www.kaggle.com/competitions" },
            { title: "DrivenData Challenges", type: "Global", date: "Monthly", difficulty: "Hard", url: "https://www.drivendata.org/" }
        ]
    },
    "Cloud Engineer": {
        skills: ["AWS", "Azure", "GCP", "Terraform", "Kubernetes", "Docker"],
        certs: [
            { title: "AWS Solutions Architect", platform: "Amazon", icon: "☁️", relevance: "Critical", time: "4 Months" },
            { title: "Microsoft Azure Fundamentals", platform: "Microsoft", icon: "🔵", relevance: "High", time: "2 Months" },
            { title: "CKA (Kubernetes)", platform: "CNCF", icon: "☸️", relevance: "High", time: "3 Months" }
        ],
        projects: [
            { title: "Multi-Region HA Cluster", description: "Fault-tolerant infrastructure deployment across 3 regions using Terraform.", skills: ["Terraform", "AWS", "Ansible"], impact: "High" },
            { title: "Serverless Data Pipeline", description: "Real-time data ingestion and processing using AWS Lambda and Kinesis.", skills: ["Node.js", "Lambda", "EventBridge"], impact: "High" },
            { title: "K8s Self-Healing Cluster", description: "Automated recovery and scaling using Helm and Prometheus monitoring.", skills: ["Kubernetes", "Helm", "Prometheus"], impact: "High" }
        ],
        competitions: [
            { title: "HashiCorp Capture the Flag", type: "Elite", date: "Quarterly", difficulty: "Hard", url: "https://www.hashicorp.com/events" },
            { title: "AWS GameDay", type: "Global", date: "Monthly", difficulty: "Medium", url: "https://aws.amazon.com/gameday/" }
        ]
    },
    "AI/ML Engineer": {
        skills: ["PyTorch", "TensorFlow", "Transformers", "LLM", "CV", "MLOps"],
        certs: [
            { title: "TensorFlow Developer", platform: "Google", icon: "🧠", relevance: "High", time: "3 Months" },
            { title: "Deep Learning Specialization", platform: "Coursera", icon: "🧬", relevance: "Critical", time: "5 Months" },
            { title: "NVIDIA Jetson AI Specialist", platform: "NVIDIA", icon: "🔌", relevance: "High", time: "2 Months" }
        ],
        projects: [
            { title: "LLM-powered RAG System", description: "Intelligent Q&A system for enterprise docs using vector databases.", skills: ["LangChain", "OpenAI", "Pinecone"], impact: "High" },
            { title: "Real-time Object Detection", description: "Edge-AI implementation for autonomous drone navigation and safety.", skills: ["YOLOv8", "Python", "TensorRT"], impact: "High" },
            { title: "Neural Style Transfer Web App", description: "Artistic style transfer for user-uploaded images using CNNs.", skills: ["PyTorch", "Flask", "React"], impact: "High" }
        ],
        competitions: [
            { title: "AI Crowd", type: "Global", date: "Continuous", difficulty: "Hard", url: "https://www.aicrowd.com/" },
            { title: "CVPR Workshops", type: "Elite", date: "Annual", difficulty: "Elite", url: "https://cvpr.thecvf.com/" }
        ]
    },
    "Cybersecurity Analyst": {
        skills: ["Linux", "Networking", "Burp Suite", "Metasploit", "Python", "Wireshark"],
        certs: [
            { title: "CompTIA Security+", platform: "CompTIA", icon: "🔐", relevance: "Critical", time: "3 Months" },
            { title: "CEH (Ethical Hacker)", platform: "EC-Council", icon: "🕵️", relevance: "High", time: "4 Months" },
            { title: "CISSP (Concentration)", platform: "ISC2", icon: "🛡️", relevance: "Elite", time: "9 Months" }
        ],
        projects: [
            { title: "Penetration Testing Lab", description: "Virtual lab simulating corporate network for exploit research and hardening.", skills: ["Kali", "Docker", "Metasploit"], impact: "High" },
            { title: "Automated Vuln Scanner", description: "Custom Python tool for scheduled scanning and reporting of OWASP Top 10.", skills: ["Python", "Nmap", "Zap"], impact: "High" },
            { title: "IDS/IPS Traffic Analyzer", description: "Network intrusion detection system with real-time alerting and ELK dash.", skills: ["Snort", "ELK Stack", "Suricata"], impact: "High" }
        ],
        competitions: [
            { title: "TryHackMe Pathways", type: "Global", date: "Self-Paced", difficulty: "Medium", url: "https://tryhackme.com/" },
            { title: "HTB Business CTF", type: "Elite", date: "Annual", difficulty: "Hard", url: "https://www.hackthebox.com/hacker/ctf" }
        ]
    },
    "UI/UX Designer": {
        skills: ["Figma", "Adobe XD", "User Research", "Wireframing", "Prototyping", "Design Systems"],
        certs: [
            { title: "Google UX Design", platform: "Coursera", icon: "🎨", relevance: "Critical", time: "6 Months" },
            { title: "NN/g UX Master", platform: "Nielsen Norman", icon: "📐", relevance: "Elite", time: "12 Months" },
            { title: "Adobe Certified Professional", platform: "Adobe", icon: "🖌️", relevance: "High", time: "3 Months" }
        ],
        projects: [
            { title: "Fintech App Prototype", description: "Highly interactive high-fidelity prototype for a neo-banking application.", skills: ["Figma", "ProtoPie", "User Testing"], impact: "High" },
            { title: "Wellness Dashboard Design", description: "Human-centric design for health tracking with accessibility as primary focus.", skills: ["Figma", "InVision", "WCAG"], impact: "High" },
            { title: "Travel Experience Web", description: "Concept-driven landing page with immersive 3D Spline interactions.", skills: ["Figma", "Spline", "Webflow"], impact: "High" }
        ],
        competitions: [
            { title: "Behance Portfolio Review", type: "Global", date: "Quarterly", difficulty: "Medium", url: "https://www.behance.net/" },
            { title: "Dribbble Design Sprints", type: "Elite", date: "Weekly", difficulty: "Medium", url: "https://dribbble.com/" }
        ]
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
   - "projects": 3 high-impact system architecture projects.
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
