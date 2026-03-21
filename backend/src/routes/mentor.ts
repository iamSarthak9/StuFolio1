import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { AuthRequest, authenticateToken, requireRole } from "../middleware/auth";
import { sendMail } from "../lib/mailer";

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
            orderBy: { enrollment: 'asc' },
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
                enrollment: s.enrollment,
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

        const where: Prisma.StudentWhereInput = { section: mentor.section };
        if (section) where.section = section as string;
        if (semester) where.semester = semester as string;
        if (search) {
            where.user = { name: { contains: String(search), mode: 'insensitive' } };
        }

        const students = await prisma.student.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
                attendances: true,
                codingProfiles: true,
            },
            orderBy: { enrollment: "asc" },
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
        attendanceDate.setUTCHours(0, 0, 0, 0);

        // Pre-fetch all existing daily attendance records for this subject/date and these students
        const studentIds = records.map((r: any) => r.studentId);
        const existingRecords = await prisma.dailyAttendance.findMany({
            where: {
                studentId: { in: studentIds },
                subjectId,
                date: attendanceDate
            }
        });
        const existingMap = new Map(existingRecords.map((r) => [r.studentId, r]));

        // Transaction to ensure atomicity
        await prisma.$transaction(async (tx: any) => {
            const operations: Promise<any>[] = [];
            const typedRecords = records as { studentId: string, status: string }[];
            for (const record of typedRecords) {
                // 1. Log daily attendance
                const existing = existingMap.get(record.studentId);

                if (existing) {
                    // Update existing
                    if (existing.status !== record.status) {
                        // Update summary if status changed
                        const updateData: any = {};
                        if (record.status === "PRESENT") updateData.attended = { increment: 1 };
                        else if (existing.status === "PRESENT") updateData.attended = { decrement: 1 };

                        operations.push(tx.attendance.update({
                            where: { studentId_subjectId: { studentId: record.studentId, subjectId } },
                            data: updateData
                        }));
                    }
                    operations.push(tx.dailyAttendance.update({
                        where: { id: existing.id },
                        data: { status: record.status }
                    }));
                } else {
                    // Create new
                    operations.push(tx.dailyAttendance.create({
                        data: {
                            studentId: record.studentId,
                            subjectId,
                            date: attendanceDate,
                            status: record.status,
                            mentorId: mentor.id
                        }
                    }));

                    // Update summary
                    operations.push(tx.attendance.upsert({
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
                    }));
                }
            }
            
            if (operations.length > 0) {
                await Promise.all(operations);
            }
        });

        return res.json({ message: "Attendance recorded successfully" });
    } catch (error: any) {
        console.error("Daily attendance error:", error);
        return res.status(500).json({ error: "Failed to submit attendance" });
    }
});

// GET /api/mentor/attendance/day — multi-subject grid data
router.get("/attendance/day", authenticateToken, requireRole("MENTOR"), async (req: AuthRequest, res: Response) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: "Date is required" });

        const mentor = await prisma.mentor.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!mentor) return res.status(404).json({ error: "Mentor not found" });

        // Get all students in mentor's section
        const students = await prisma.student.findMany({
            where: { section: mentor.section },
            select: { id: true, user: { select: { name: true } }, enrollment: true }
        });

        // Get all subjects (4th semester as requested)
        const subjects = await prisma.subject.findMany({
            where: { semester: "4th Semester" },
            orderBy: { code: "asc" }
        });

        const attendanceDate = new Date(date as string);
        attendanceDate.setUTCHours(0, 0, 0, 0);

        const nextDay = new Date(attendanceDate);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);

        const records = await (prisma as any).dailyAttendance.findMany({
            where: {
                date: { gte: attendanceDate, lt: nextDay },
                studentId: { in: students.map(s => s.id) },
                subjectId: { in: subjects.map(s => s.id) }
            },
            select: { studentId: true, subjectId: true, status: true }
        });

        // Map students to align with the frontend expectation
        const studentList = students.map(s => ({
            id: s.id,
            name: s.user.name,
            enrollment: s.enrollment
        }));

        return res.json({
            students: studentList,
            subjects,
            records
        });
    } catch (error: any) {
        console.error("Day attendance fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch attendance data" });
    }
});

// POST /api/mentor/attendance/day — bulk update for all subjects
router.post("/attendance/day", authenticateToken, requireRole("MENTOR"), async (req: AuthRequest, res: Response) => {
    try {
        const { date, records } = req.body; // records: [{studentId, subjectId, status}]
        if (!date || !records) return res.status(400).json({ error: "Date and records are required" });

        const mentor = await prisma.mentor.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!mentor) return res.status(404).json({ error: "Mentor not found" });

        const attendanceDate = new Date(date);
        attendanceDate.setUTCHours(0, 0, 0, 0);

        console.log(`[DEBUG] Bulk attendance submit for date: ${attendanceDate.toISOString()}, records: ${records.length}`);

        // 1. Fetch all students in this section to verify ownership and use for queries
        const students = await prisma.student.findMany({
            where: { section: mentor.section },
            select: { id: true }
        });
        const studentIds = students.map(s => s.id);

        // 2. Fetch all EXISTING DailyAttendance records for these students on this date
        const existingDailyRecords = await (prisma as any).dailyAttendance.findMany({
            where: {
                studentId: { in: studentIds },
                date: attendanceDate
            }
        });

        // 3. Fetch all EXISTING Attendance summaries for these students
        const existingSummaries = await prisma.attendance.findMany({
            where: { studentId: { in: studentIds } }
        });

        // Create quick lookup maps
        const dailyRecordMap = new Map(existingDailyRecords.map((r: any) => [`${r.studentId}_${r.subjectId}`, r]));
        const summaryMap = new Map(existingSummaries.map((s: any) => [`${s.studentId}_${s.subjectId}`, s]));

        // Transaction with extended timeout
        await (prisma as any).$transaction(async (tx: any) => {
            const operations: Promise<any>[] = [];
            
            for (const record of records) {
                const { studentId, subjectId, status } = record;

                // Security check: only allow updating students in mentor's section
                if (!studentIds.includes(studentId)) continue;

                const key = `${studentId}_${subjectId}`;
                const existing = dailyRecordMap.get(key);
                const oldStatus = existing ? (existing as any).status : "NO_CLASS";
                const newStatus = status;

                if (oldStatus === newStatus) continue;

                // Update DailyAttendance
                if (newStatus === "NO_CLASS") {
                    if (existing) {
                        operations.push(tx.dailyAttendance.delete({ where: { id: (existing as any).id } }));
                    }
                } else {
                    operations.push(tx.dailyAttendance.upsert({
                        where: { studentId_subjectId_date: { studentId, subjectId, date: attendanceDate } },
                        create: { studentId, subjectId, date: attendanceDate, status: newStatus, mentorId: mentor.id },
                        update: { status: newStatus }
                    }));
                }

                // Update Summary
                const updateData: any = {};
                let createData = { studentId, subjectId, total: 1, attended: 0 };

                if (oldStatus === "NO_CLASS") {
                    updateData.total = { increment: 1 };
                    if (newStatus === "PRESENT") {
                        updateData.attended = { increment: 1 };
                        createData.attended = 1;
                    }
                } else if (newStatus === "NO_CLASS") {
                    updateData.total = { decrement: 1 };
                    if (oldStatus === "PRESENT") updateData.attended = { decrement: 1 };
                } else {
                    if (oldStatus === "PRESENT" && newStatus === "ABSENT") updateData.attended = { decrement: 1 };
                    if (oldStatus === "ABSENT" && newStatus === "PRESENT") updateData.attended = { increment: 1 };
                }

                if (Object.keys(updateData).length > 0) {
                    operations.push(tx.attendance.upsert({
                        where: { studentId_subjectId: { studentId, subjectId } },
                        create: createData,
                        update: updateData
                    }));
                }
            }

            // Execute all batched operations concurrently
            if (operations.length > 0) {
                await Promise.all(operations);
            }
        }, {
            timeout: 60000 // 60 seconds timeout for bulk operations
        });

        return res.json({ success: true });
    } catch (error: any) {
        console.error("Day attendance submit error detailed:", {
            message: error.message,
            stack: error.stack,
            code: error.code,
            meta: error.meta
        });
        return res.status(500).json({ error: error.message || "Failed to submit attendance data" });
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

// POST /api/mentor/students/:id/alert — send email alert to student
router.post("/students/:id/alert", authenticateToken, requireRole("MENTOR"), async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.params.id as string;
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ error: "Subject and message are required" });
        }

        const mentor = await prisma.mentor.findUnique({
            where: { userId: req.user!.userId },
            include: { user: { select: { name: true, email: true } } },
        });

        if (!mentor) return res.status(404).json({ error: "Mentor not found" });

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { user: { select: { name: true, email: true, id: true } } },
        });

        if (!student) return res.status(404).json({ error: "Student not found" });

        // Ensure mentor can only alert students in their section
        if (student.section !== mentor.section) {
            return res.status(403).json({ error: "You can only alert students in your designated section" });
        }

        // Format HTML Email
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">Academic Alert: StuFolio</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Dear <strong>${student.user.name}</strong>,</p>
                    <p>You have received a new alert from your mentor, <strong>${mentor.user.name}</strong>:</p>
                    <div style="background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <h4 style="margin-top: 0; color: #0f172a;">${subject}</h4>
                        <p style="margin-bottom: 0; color: #334155; white-space: pre-wrap;">${message}</p>
                    </div>
                    <p>Please log in to your <a href="http://localhost:8080" style="color: #2563eb; font-weight: bold;">StuFolio Dashboard</a> to review your academic standing and take necessary actions.</p>
                </div>
                <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                    <p style="margin: 0;">This is an automated message from the StuFolio system.</p>
                    <p style="margin: 5px 0 0 0;">Reply-To: ${mentor.user.email}</p>
                </div>
            </div>
        `;

        // Send Email via Nodemailer test account
        await sendMail({
            to: student.user.email,
            subject: `[StuFolio] Alert from ${mentor.user.name}: ${subject}`,
            html
        });

        // Save internal notification
        await prisma.notification.create({
            data: {
                userId: student.user.id,
                title: subject,
                message: `Alert from ${mentor.user.name}: ${message}`,
                category: "performance"
            }
        });

        return res.json({ success: true, message: "Alert sent successfully" });
    } catch (error: any) {
        console.error("Mentor alert error:", error);
        return res.status(500).json({ error: "Failed to send alert email" });
    }
});

// GET /api/mentor/profile — fetch mentor profile
router.get("/profile", authenticateToken, requireRole("MENTOR"), async (req: AuthRequest, res: Response) => {
    try {
        const mentor = await prisma.mentor.findUnique({
            where: { userId: req.user!.userId },
            include: { user: { select: { name: true, email: true } } },
        });

        if (!mentor) return res.status(404).json({ error: "Mentor not found" });

        return res.json({
            profile: {
                id: mentor.id,
                name: (mentor as any).user.name,
                email: (mentor as any).user.email,
                teacherId: (mentor as any).teacherId,
                department: mentor.department,
                designation: mentor.designation,
                section: mentor.section,
            }
        });
    } catch (error: any) {
        console.error("Mentor profile fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch mentor profile" });
    }
});

// PATCH /api/mentor/profile — update mentor profile
router.patch("/profile", authenticateToken, requireRole("MENTOR"), async (req: AuthRequest, res: Response) => {
    try {
        const { name, teacherId, department, designation, section } = req.body;
        const mentor = await prisma.mentor.findUnique({
            where: { userId: req.user!.userId },
            include: { user: { select: { name: true, email: true } } },
        });

        if (!mentor) return res.status(404).json({ error: "Mentor not found" });

        const updatedMentor = await prisma.mentor.update({
            where: { id: mentor.id },
            data: {
                teacherId,
                department,
                designation,
                section,
                user: name ? { update: { name } } : undefined,
            } as any,
            include: { user: { select: { name: true, email: true } } },
        });

        return res.json({
            profile: {
                id: updatedMentor.id,
                name: (updatedMentor as any).user.name,
                email: (updatedMentor as any).user.email,
                teacherId: (updatedMentor as any).teacherId,
                department: updatedMentor.department,
                designation: updatedMentor.designation,
                section: updatedMentor.section,
            }
        });
    } catch (error: any) {
        console.error("Mentor profile update error:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Teacher ID already exists" });
        }
        return res.status(500).json({ error: "Failed to update mentor profile" });
    }
});

export default router;
