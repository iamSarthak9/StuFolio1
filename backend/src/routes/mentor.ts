import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest, authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

// GET /api/mentor/dashboard — overview stats + student list
router.get("/dashboard", authenticateToken, requireRole("MENTOR"), async (req: AuthRequest, res: Response) => {
    try {
        const mentor = await prisma.mentor.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!mentor) return res.status(404).json({ error: "Mentor profile not found" });

        // Get all students in mentor's section
        const students = await prisma.student.findMany({
            where: { section: mentor.section },
            include: {
                user: { select: { name: true } },
                attendances: { include: { subject: true } },
                codingProfiles: true,
            },
        });

        const totalStudents = students.length;

        // At-risk students (attendance below 75% in any subject)
        const atRiskStudents = students.filter((s) =>
            s.attendances.some((a) => (a.attended / a.total) * 100 < 75)
        );

        // CGPA distribution
        const cgpaRanges = [
            { range: "Below 6", count: 0 },
            { range: "6-7", count: 0 },
            { range: "7-8", count: 0 },
            { range: "8-9", count: 0 },
            { range: "9+", count: 0 },
        ];
        students.forEach((s) => {
            if (s.cgpa < 6) cgpaRanges[0].count++;
            else if (s.cgpa < 7) cgpaRanges[1].count++;
            else if (s.cgpa < 8) cgpaRanges[2].count++;
            else if (s.cgpa < 9) cgpaRanges[3].count++;
            else cgpaRanges[4].count++;
        });

        // Attendance distribution
        const aboveThreshold = students.filter((s) => {
            const totalAtt = s.attendances.reduce((sum, a) => sum + a.attended, 0);
            const totalClasses = s.attendances.reduce((sum, a) => sum + a.total, 0);
            return totalClasses > 0 && (totalAtt / totalClasses) * 100 >= 85;
        }).length;

        const nearThreshold = students.filter((s) => {
            const totalAtt = s.attendances.reduce((sum, a) => sum + a.attended, 0);
            const totalClasses = s.attendances.reduce((sum, a) => sum + a.total, 0);
            const pct = totalClasses > 0 ? (totalAtt / totalClasses) * 100 : 0;
            return pct >= 75 && pct < 85;
        }).length;

        const belowThreshold = totalStudents - aboveThreshold - nearThreshold;

        // Average CGPA
        const avgCGPA = totalStudents > 0
            ? (students.reduce((sum, s) => sum + s.cgpa, 0) / totalStudents).toFixed(2)
            : "0";

        // Student list for table
        const studentList = students.map((s) => {
            const totalProblems = s.codingProfiles.reduce((sum, cp) => {
                const stats = JSON.parse(cp.stats) as { label: string; value: string }[];
                const solved = stats.find((st) => st.label.toLowerCase().includes("solved"));
                return sum + (solved ? parseInt(solved.value.replace(/,/g, "")) || 0 : 0);
            }, 0);

            const totalAtt = s.attendances.reduce((sum, a) => sum + a.attended, 0);
            const totalClasses = s.attendances.reduce((sum, a) => sum + a.total, 0);
            const attPct = totalClasses > 0 ? Math.round((totalAtt / totalClasses) * 100) : 0;

            return {
                id: s.id,
                name: s.user.name,
                cgpa: s.cgpa,
                problems: totalProblems,
                attendance: attPct,
                status: attPct < 75 ? "danger" : s.cgpa < 6 ? "warning" : "ok",
                trend: s.cgpa >= 8 ? "up" : s.cgpa >= 7 ? "same" : "down",
            };
        });

        return res.json({
            stats: {
                totalStudents,
                atRiskCount: atRiskStudents.length,
                averageCGPA: avgCGPA,
                section: mentor.section,
            },
            cgpaDistribution: cgpaRanges,
            attendanceDistribution: [
                { name: "Above 85%", value: aboveThreshold, color: "hsl(160, 84%, 39%)" },
                { name: "75-85%", value: nearThreshold, color: "hsl(217, 91%, 60%)" },
                { name: "Below 75%", value: belowThreshold, color: "hsl(0, 72%, 51%)" },
            ],
            students: studentList,
        });
    } catch (error: any) {
        console.error("Mentor dashboard error:", error);
        return res.status(500).json({ error: "Failed to load dashboard" });
    }
});

// GET /api/mentor/students — all students with optional filters
router.get("/students", authenticateToken, requireRole("MENTOR"), async (req: AuthRequest, res: Response) => {
    try {
        const { section, semester, search } = req.query;

        const mentor = await prisma.mentor.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!mentor) return res.status(404).json({ error: "Mentor not found" });

        const where: any = { section: mentor.section };
        if (section) where.section = section;
        if (semester) where.semester = semester;
        if (search) {
            where.user = { name: { contains: String(search) } };
        }

        const students = await prisma.student.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
                attendances: true,
                codingProfiles: true,
            },
            orderBy: { cgpa: "desc" },
        });

        return res.json(
            students.map((s) => {
                const totalAtt = s.attendances.reduce((sum, a) => sum + a.attended, 0);
                const totalClasses = s.attendances.reduce((sum, a) => sum + a.total, 0);
                return {
                    id: s.id,
                    name: s.user.name,
                    email: s.user.email,
                    enrollment: s.enrollment,
                    cgpa: s.cgpa,
                    attendance: totalClasses > 0 ? Math.round((totalAtt / totalClasses) * 100) : 0,
                    section: s.section,
                    semester: s.semester,
                };
            })
        );
    } catch (error: any) {
        console.error("Mentor students error:", error);
        return res.status(500).json({ error: "Failed to load students" });
    }
});

// GET /api/mentor/subjects — subjects for the mentor's section
router.get("/subjects", authenticateToken, requireRole("MENTOR"), async (req: AuthRequest, res: Response) => {
    try {
        const mentor = await prisma.mentor.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!mentor) return res.status(404).json({ error: "Mentor not found" });

        // Fetch students in this section to find their semester
        const student = await prisma.student.findFirst({
            where: { section: mentor.section },
            select: { semester: true }
        });

        if (!student) return res.json([]); // No students, no subjects needed yet

        const subjects = await prisma.subject.findMany({
            where: { semester: student.semester },
            orderBy: { name: "asc" }
        });

        return res.json(subjects);
    } catch (error: any) {
        console.error("Mentor subjects error:", error);
        return res.status(500).json({ error: "Failed to load subjects" });
    }
});

// POST /api/mentor/attendance/daily — submit daily attendance
router.post("/attendance/daily", authenticateToken, requireRole("MENTOR"), async (req: AuthRequest, res: Response) => {
    try {
        const { subjectId, date, records } = req.body; // records: [{studentId, status}]
        const mentor = await prisma.mentor.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!mentor) return res.status(404).json({ error: "Mentor not found" });

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            for (const record of records) {
                // 1. Log daily attendance
                const existing = await tx.dailyAttendance.findUnique({
                    where: {
                        studentId_subjectId_date: {
                            studentId: record.studentId,
                            subjectId,
                            date: attendanceDate,
                        }
                    }
                });

                if (existing) {
                    // Update existing
                    if (existing.status !== record.status) {
                        // Update summary if status changed
                        const updateData: any = {};
                        if (record.status === "PRESENT") updateData.attended = { increment: 1 };
                        else updateData.attended = { decrement: 1 };

                        await tx.attendance.update({
                            where: { studentId_subjectId: { studentId: record.studentId, subjectId } },
                            data: updateData
                        });
                    }
                    await tx.dailyAttendance.update({
                        where: { id: existing.id },
                        data: { status: record.status }
                    });
                } else {
                    // Create new
                    await tx.dailyAttendance.create({
                        data: {
                            studentId: record.studentId,
                            subjectId,
                            date: attendanceDate,
                            status: record.status,
                            mentorId: mentor.id
                        }
                    });

                    // Update summary
                    await tx.attendance.upsert({
                        where: { studentId_subjectId: { studentId: record.studentId, subjectId } },
                        create: {
                            studentId: record.studentId,
                            subjectId,
                            attended: record.status === "PRESENT" ? 1 : 0,
                            total: 1
                        },
                        update: {
                            total: { increment: 1 },
                            attended: record.status === "PRESENT" ? { increment: 1 } : undefined
                        }
                    });
                }
            }
        });

        return res.json({ message: "Attendance recorded successfully" });
    } catch (error: any) {
        console.error("Daily attendance error:", error);
        return res.status(500).json({ error: "Failed to submit attendance" });
    }
});

// PATCH /api/mentor/students/:id/academics — update student marks
router.patch("/students/:id/academics", authenticateToken, requireRole("MENTOR"), async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.params.id as string;
        const { subjectId, marks, semester } = req.body;

        const record = await prisma.academicRecord.upsert({
            where: {
                studentId_subjectId_semester: {
                    studentId,
                    subjectId: subjectId as string,
                    semester: semester as string
                }
            },
            create: {
                studentId,
                subjectId: subjectId as string,
                marks,
                semester: semester as string,
                maxMarks: 100
            },
            update: {
                marks
            }
        });

        // Recalculate CGPA (simplified: average of all records)
        const allRecords = await prisma.academicRecord.findMany({
            where: { studentId }
        });
        const totalMarksPercent = allRecords.reduce((sum, r) => sum + (r.marks / r.maxMarks), 0);
        const avgPercent = (totalMarksPercent / allRecords.length) * 100;
        const newCGPA = Number((avgPercent / 10).toFixed(2)); // basic conversion

        await prisma.student.update({
            where: { id: studentId },
            data: { cgpa: newCGPA }
        });

        return res.json({ record, newCGPA });
    } catch (error: any) {
        console.error("Academic update error:", error);
        return res.status(500).json({ error: "Failed to update marks" });
    }
});

// GET /api/mentor/analytics — batch analytics
router.get("/analytics", authenticateToken, requireRole("MENTOR"), async (req: AuthRequest, res: Response) => {
    try {
        const mentor = await prisma.mentor.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!mentor) return res.status(404).json({ error: "Mentor not found" });

        const students = await prisma.student.findMany({
            where: { section: mentor.section },
            include: {
                semesterCGPAs: { orderBy: { semester: "asc" } },
                attendances: { include: { subject: true } },
                academicRecords: { include: { subject: true } },
            },
        });

        // Performance bands
        const bands = {
            excellent: students.filter((s) => s.cgpa >= 9).length,
            good: students.filter((s) => s.cgpa >= 8 && s.cgpa < 9).length,
            average: students.filter((s) => s.cgpa >= 7 && s.cgpa < 8).length,
            belowAverage: students.filter((s) => s.cgpa >= 6 && s.cgpa < 7).length,
            poor: students.filter((s) => s.cgpa < 6).length,
        };

        // Subject-wise average marks
        const subjectAverages: Record<string, { total: number; count: number; name: string }> = {};
        students.forEach((s) => {
            s.academicRecords.forEach((r) => {
                if (!subjectAverages[r.subject.code]) {
                    subjectAverages[r.subject.code] = { total: 0, count: 0, name: r.subject.name };
                }
                subjectAverages[r.subject.code].total += r.marks;
                subjectAverages[r.subject.code].count++;
            });
        });

        const subjectStats = Object.entries(subjectAverages).map(([code, data]) => ({
            code,
            name: data.name,
            average: Number((data.total / data.count).toFixed(1)),
        }));

        return res.json({
            totalStudents: students.length,
            performanceBands: bands,
            subjectAverages: subjectStats,
        });
    } catch (error: any) {
        console.error("Analytics error:", error);
        return res.status(500).json({ error: "Failed to load analytics" });
    }
});

export default router;
