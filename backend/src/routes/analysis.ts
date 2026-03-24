import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest, authenticateToken, requireRole } from "../middleware/auth";
import { getGeminiModel, generateWithRetry } from "../lib/gemini";

const router = Router();

// In-memory cache for analysis (valid for 5 minutes)
const analysisCache = new Map<string, { data: any, timestamp: number }>();

// GET /api/analysis/me — Get AI-driven performance analysis
router.get("/me", authenticateToken, requireRole("STUDENT", "student"), async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.userId;
        
        // Cache Check
        const cached = analysisCache.get(studentId);
        if (cached && Date.now() - cached.timestamp < 1000 * 60 * 5) {
            console.log(`[Analysis] Serving cached data for ${studentId}`);
            return res.json(cached.data);
        }

        const user = await prisma.user.findUnique({
            where: { id: studentId },
            include: {
                student: {
                    include: {
                        academicRecords: { include: { subject: true } },
                        attendances: { include: { subject: true } },
                        semesterCGPAs: true,
                        codingProfiles: true,
                    }
                }
            }
        });

        if (!user?.student) return res.status(404).json({ error: "Student not found" });

        const student = user.student;

        // 1. Strength & Weakness Map (Radar Chart Data)
        const strengthData = student.academicRecords.map(r => ({
            subject: r.subject.code,
            score: (r.marks / r.maxMarks) * 100,
            fullMark: 100
        }));

        // 2. GPA Prediction (Weighted Moving Average)
        const sortedSemesters = student.semesterCGPAs.sort((a, b) => a.semester.localeCompare(b.semester));
        const actualData = sortedSemesters.map(s => ({
            sem: `Sem ${s.semester}`,
            actual: s.cgpa,
            predicted: null as number | null
        }));

        let predictedNext: number | null = null;
        if (actualData.length >= 2) {
            let weightedSum = 0;
            let weightTotal = 0;
            for (let i = 0; i < actualData.length; i++) {
                const weight = i + 1;
                weightedSum += actualData[i].actual * weight;
                weightTotal += weight;
            }
            predictedNext = weightedSum / weightTotal;
            predictedNext = Math.min(10, Math.max(0, predictedNext));
        } else if (actualData.length === 1) {
            predictedNext = actualData[0].actual;
        }

        const predictionData = [
            ...actualData,
            { sem: `Sem ${actualData.length + 1}`, actual: null, predicted: predictedNext || student.cgpa }
        ];

        // 3. True AI Gen: Suggestions and Explainable AI
        const lowScores = strengthData.filter(s => s.score < 70);
        
        let codingSolved = 0;
        try {
            codingSolved = student.codingProfiles.reduce((acc, cp) => {
                const stats = typeof cp.stats === 'string' ? JSON.parse(cp.stats || "[]") : cp.stats;
                const solved = stats.find((s: any) => s.label.includes("Solved"))?.value || 0;
                return acc + parseInt(solved || 0);
            }, 0);
        } catch(e) {}

        const currentCgpa = student.cgpa;

        const promptContext = {
            name: user.name,
            cgpa: student.cgpa,
            predictedNextGPA: predictedNext,
            academicScores: strengthData,
            attendance: student.attendances.map(a => ({ subject: a.subject.code, attendedPercent: Math.round((a.attended / a.total) * 100) })),
            codingSolvedTotal: codingSolved,
            codingStreak: student.streak
        };

        const systemInstruction = `You are an AI academic advisor analyzing a student's profile.
Analyze the following student data covering both academics and coding.
Return a JSON object strictly containing EXACTLY two arrays:
1. "suggestions": An array of at least 4 objects. Each object must have:
   - "icon": A string (one of "AlertTriangle", "BookOpen", "Zap", "TrendingUp", "CheckCircle", "Target").
   - "title": A short title.
   - "description": Personalized, actionable advice based on their data.
   - "priority": "high", "medium", or "low".
   - "color": Tailwind classes for dark mode visibility (e.g., "text-amber-500 bg-amber-500/10 border-amber-500/20").
2. "insights": An array of exactly 3 objects explaining *why* their trajectory/performance is the way it is. Each object must have:
   - "question": A short question.
   - "answer": A deep, explainable AI answer.
   - "icon": A single emoji.`;

        let suggestions: any[] = [];
        let insights: any[] = [];
        
        try {
            const model = getGeminiModel("gemini-1.5-flash");
            const result = await generateWithRetry(model, systemInstruction + "\n\nStudent Data:\n" + JSON.stringify(promptContext));
            const responseText = result.response.text();
            let cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
            const aiData = JSON.parse(cleanedText);
            suggestions = aiData.suggestions || [];
            insights = aiData.insights || [];
        } catch (e: any) {
            console.error("[Analysis] AI generation failed:", e.message);
            suggestions = [{ title: "AI Temporarily Unavailable", description: "Google's AI servers are a bit busy. Basic suggestions enabled.", icon: "AlertTriangle", priority: "low", color: "text-blue-500 bg-blue-500/20" }];
            insights = [{ question: "Why is the AI not loading?", answer: "The free-tier API is experiencing high demand. Please refresh in a minute!", icon: "⏳" }];
        }

        const currentSem = actualData.length;
        const totalSems = 8;
        const remainingSems = totalSems - currentSem;
        const goalRoadmap: any[] = [];

        [8.5, 9.0].forEach(target => {
            if (currentSem === 0 || currentSem >= totalSems) {
                goalRoadmap.push({ target: `${target.toFixed(1)} CGPA`, needed: "Need data", feasibility: "Unknown", color: "text-muted-foreground" });
                return;
            }

            const requiredSgpaAvg = (target * totalSems - currentCgpa * currentSem) / remainingSems;

            let feasibility = "Very Likely";
            let color = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
            
            if (requiredSgpaAvg > 10) { 
                feasibility = "Impossible"; 
                color = "text-rose-500 bg-rose-500/10 border-rose-500/20"; 
            } else if (requiredSgpaAvg > 9.0) { 
                feasibility = "Challenging"; 
                color = "text-amber-500 bg-amber-500/10 border-amber-500/20"; 
            } else if (requiredSgpaAvg <= currentCgpa) {
                feasibility = "Very Likely";
                color = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
            } else {
                feasibility = "Possible";
                color = "text-purple-500 bg-purple-500/10 border-purple-500/20";
            }
            
            goalRoadmap.push({ target: `${target.toFixed(1)} CGPA`, needed: `Requires ~${requiredSgpaAvg.toFixed(2)} SGPA`, feasibility, color });
        });

        const responseData = {
            strengthData,
            predictionData,
            suggestions: suggestions.slice(0, 4),
            insights: insights.slice(0, 3),
            goalRoadmap,
            currentCgpa,
            currentSem,
            totalSems,
            overallTrend: (predictedNext || 0) >= currentCgpa ? "Upward ↑" : "Steady",
            predictedGPA: predictedNext || currentCgpa,
            weakAreas: lowScores.map(s => s.subject).join(", ") || "None identified"
        };

        // Update Cache
        analysisCache.set(studentId, { data: responseData, timestamp: Date.now() });

        return res.json(responseData);
    } catch (error: any) {
        console.error("Analysis error:", error);
        return res.status(500).json({ error: "Failed to generate analysis" });
    }
});

export default router;
