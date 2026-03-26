import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest, authenticateToken, requireRole } from "../middleware/auth";
import { getStudentGlobalRank } from "../services/leaderboardService";
import { generateChatResponse } from "../lib/ai";

const router = Router();

router.post("/", authenticateToken, requireRole("STUDENT", "student"), async (req: AuthRequest, res: Response) => {
    console.log(`📡 [Chat] POST /api/chat - User: ${req.user?.userId}, Role: ${req.user?.role}`);
    try {
        const { message, context } = req.body;
        console.log(`📡 [Chat] Payload: ${JSON.stringify(req.body)}`);
        if (!message) return res.status(400).json({ error: "Message is required" });

        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
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
        const globalRank = await getStudentGlobalRank(student.id);

        // Build the prompt context
        const contextData = {
            name: user.name,
            cgpa: student.cgpa,
            rank: globalRank || "Unranked",
            performanceIdx: student.performanceIdx,
            codingScore: student.codingScore,
            streak: student.streak,
            codingProfilesConnected: student.codingProfiles?.map(cp => cp.platform).join(', ') || "None",
            attendance: student.attendances.map(a => ({
                subject: a.subject.name,
                percentage: Math.round((a.attended / a.total) * 100)
            })),
            academics: student.academicRecords.map(r => ({
                subject: r.subject.name,
                score: Math.round((r.marks / r.maxMarks) * 100)
            }))
        };

        const systemPrompt = `You are StuBot, a friendly and helpful AI assistant for the StuFolio student portal. 
You are talking to ${user.name}. Keep your answers short, conversational, and use plenty of emojis. 
IMPORTANT: Do not use Markdown asterisks (**) or formatting. Return only plain, friendly text with emojis.
Here is the student's current StuFolio data (from the database):
${JSON.stringify(contextData, null, 2)}
If they ask about their grades, attendance, CGPA, rank, coding stats, or streaks, reference the exact data above to give them an accurate answer.
${context ? `\n[UI CONTEXT] The user is currently viewing the following dynamically computed AI Analysis on their screen right now:\n${JSON.stringify(context, null, 2)}\nUse this exact context to eagerly and accurately explain their "suggestions", "weak areas", or "predicted GPA" if they ask about what is on their screen.\n` : ''}
Student message: ${message}`;

        console.log("[Chat] Calling Groq API...");
        const textResponse = await generateChatResponse(message, systemPrompt);
        
        console.log("[Chat] Groq Response received");
        return res.json({ response: textResponse });
        
    } catch (error: any) {
        console.error("❌ [Chat] API Error:", error);
        if (error.message) console.error("❌ Detail:", error.message);
        return res.status(500).json({ error: "Failed to generate chat response" });
    }
});

export default router;
