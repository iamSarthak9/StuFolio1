import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { refreshStudentProfiles } from "../services/profileService";

const router = Router();

// GET /api/leaderboard — ranked students (privacy-safe)
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { tab = "overall", filter = "all" } = req.query;

        let whereClause: any = {};

        if (filter === "my_students") {
            let section = null;
            if (req.user?.role === "MENTOR") {
                const mentor = await prisma.mentor.findUnique({
                    where: { userId: req.user.userId },
                    select: { section: true }
                });
                section = mentor?.section;
            } else if (req.user?.role === "STUDENT") {
                const student = await prisma.student.findUnique({
                    where: { userId: req.user.userId },
                    select: { section: true }
                });
                section = student?.section;
            }

            if (section) {
                whereClause.section = section;
            }
        }

        const students = await prisma.student.findMany({
            where: whereClause,
            include: {
                user: { select: { name: true } },
                codingProfiles: true,
                attendances: true,
            },
            orderBy: { cgpa: "desc" },
        });

        // Background refresh all students in the leaderboard result
        // (internal 1-hour rate limit in profileService handles the throttling)
        students.forEach(s => {
            refreshStudentProfiles(s.id).catch(err => 
                console.error(`[Leaderboard] Background refresh failed for ${s.id}:`, err)
            );
        });

        const leaderboard = students.map((s) => {
            // 1. Coding Score (0-100)
            const totalProblems = s.codingProfiles.reduce((sum, cp) => {
                const stats = JSON.parse(cp.stats) as { label: string; value: string }[];
                const solved = stats.find((st) => st.label.toLowerCase().includes("solved"));
                return sum + (solved ? parseInt(solved.value.replace(/[^0-9]/g, "")) || 0 : 0);
            }, 0);
            const codingScore = Math.min(totalProblems / 5, 80) + Math.min(s.streak, 20);

            // 2. Academic Score (0-100)
            const totalAtt = s.attendances.reduce((sum, a) => sum + a.attended, 0);
            const totalClasses = s.attendances.reduce((sum, a) => sum + a.total, 0);
            const attPct = totalClasses > 0 ? (totalAtt / totalClasses) * 100 : 0;
            const academicScore = (s.cgpa * 6) + (attPct * 0.4);

            // 3. Overall Composite (Original 50/30/20)
            const compositeScore = (s.cgpa * 3) + (Math.min(totalProblems / 5, 100) * 0.5) + (attPct * 0.2);

            let displayScore = 0;
            if (tab === "coding") displayScore = codingScore;
            else if (tab === "academic") displayScore = academicScore;
            else displayScore = compositeScore;

            return {
                rank: 0, // Assigned after sorting
                name: s.user.name,
                section: s.section,
                compositeScore: Number(displayScore.toFixed(1)),
                cgpa: s.cgpa,
                problemsSolved: totalProblems,
                streak: s.streak,
                attendance: Math.round(attPct),
            };
        });

        // Sort based on tab using the calculated display score
        leaderboard.sort((a, b) => b.compositeScore - a.compositeScore);

        // Re-rank after sort
        leaderboard.forEach((entry, i) => (entry.rank = i + 1));

        return res.json(leaderboard);
    } catch (error: any) {
        console.error("Leaderboard error:", error);
        return res.status(500).json({ error: "Failed to load leaderboard" });
    }
});

export default router;
