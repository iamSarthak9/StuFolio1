import prisma from "../lib/prisma";

/**
 * Calculates a student's global leaderboard rank dynamically,
 * matching the logic used in the main leaderboard view.
 */
export async function getStudentGlobalRank(studentId: string): Promise<number | null> {
    const students = await prisma.student.findMany({
        include: {
            codingProfiles: true,
            attendances: true,
        }
    });

    const leaderboard = students.map((s) => {
        const totalProblems = s.codingProfiles.reduce((sum, cp) => {
            try {
                const stats = JSON.parse(cp.stats) as { label: string; value: string }[];
                const solved = stats.find((st) => st.label.toLowerCase().includes("solved"));
                return sum + (solved ? parseInt(solved.value.replace(/[^0-9]/g, "")) || 0 : 0);
            } catch (e) {
                return sum;
            }
        }, 0);
        
        const totalAtt = s.attendances.reduce((sum, a) => sum + a.attended, 0);
        const totalClasses = s.attendances.reduce((sum, a) => sum + a.total, 0);
        const attPct = totalClasses > 0 ? (totalAtt / totalClasses) * 100 : 0;
        
        const compositeScore = (s.cgpa * 3) + (Math.min(totalProblems / 5, 100) * 0.5) + (attPct * 0.2);

        return { id: s.id, compositeScore };
    });

    // Sort descending by compositeScore
    leaderboard.sort((a, b) => b.compositeScore - a.compositeScore);

    // Find 1-based index
    const index = leaderboard.findIndex(s => s.id === studentId);
    if (index !== -1) return index + 1;
    
    return null;
}
