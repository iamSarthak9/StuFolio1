import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest, authenticateToken, requireRole } from "../middleware/auth";
import { fetchPlatformStats } from "../services/platformFetcher";

const router = Router();

// GET /api/students/me — dashboard data
router.get("/me", authenticateToken, requireRole("STUDENT"), async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: {
                student: {
                    include: {
                        semesterCGPAs: { orderBy: { semester: "asc" } },
                        codingProfiles: true,
                        badges: true,
                        attendances: { include: { subject: true } },
                    },
                },
            },
        });

        if (!user?.student) {
            return res.status(404).json({ error: "Student profile not found" });
        }

        const s = user.student;

        // Build dashboard response
        const statCards = [
            { label: "Performance Index", value: s.performanceIdx?.toFixed(1) || "0", change: "+5.2% this month", icon: "TrendingUp", accent: "primary" },
            { label: "Current CGPA", value: s.cgpa.toFixed(2), change: `Semester ${s.semesterCGPAs.length}`, icon: "GraduationCap", accent: "accent" },
            { label: "Problems Solved", value: String(s.codingScore || 0), change: "Across all platforms", icon: "Code", accent: "warning" },
            { label: "Day Streak", value: String(s.streak), change: "Keep it up!", icon: "Flame", accent: "accent" },
        ];

        // Coding profile summary
        const codingProfiles = s.codingProfiles.map((cp) => ({
            id: cp.id,
            platform: cp.platform,
            handle: cp.handle,
            stats: JSON.parse(cp.stats),
            verified: cp.verified,
            lastSynced: cp.lastSynced,
        }));

        // Warnings based on attendance
        const warnings = s.attendances
            .filter((a) => (a.attended / a.total) * 100 < 75)
            .map((a) => ({
                text: `${a.subject.code} attendance at ${((a.attended / a.total) * 100).toFixed(0)}% — below 75% eligibility threshold!`,
                type: "danger",
            }));

        // Performance trend from semester CGPAs
        const performanceTrend = s.semesterCGPAs.map((sc) => ({
            semester: sc.semester,
            cgpa: sc.cgpa,
        }));

        return res.json({
            profile: {
                name: user.name,
                enrollment: s.enrollment,
                section: s.section,
                semester: s.semester,
                branch: s.branch,
                year: s.year,
                cgpa: s.cgpa,
                rank: s.rank,
                totalStudents: s.totalStudents,
            },
            statCards,
            codingProfiles,
            warnings,
            performanceTrend,
            badges: s.badges.filter((b) => b.earned).map((b) => ({ label: b.label, icon: b.icon })),
        });
    } catch (error: any) {
        console.error("Student dashboard error:", error);
        return res.status(500).json({ error: "Failed to load dashboard" });
    }
});

// GET /api/students/me/profile — full profile page
router.get("/me/profile", authenticateToken, requireRole("STUDENT"), async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: {
                student: {
                    include: {
                        semesterCGPAs: { orderBy: { semester: "asc" } },
                        codingProfiles: true,
                        badges: true,
                        skills: { include: { skill: true } },
                    },
                },
            },
        });

        if (!user?.student) return res.status(404).json({ error: "Student not found" });

        const s = user.student;

        console.log(`[API] Serving profile for ${user.email}. Profiles count: ${s.codingProfiles.length}`);

        return res.json({
            profile: {
                name: user.name,
                enrollment: s.enrollment,
                email: user.email,
                section: s.section,
                semester: s.semester,
                branch: s.branch,
                year: s.year,
                cgpa: s.cgpa,
                rank: s.rank,
                totalStudents: s.totalStudents,
            },
            semesterCGPAs: s.semesterCGPAs.map((sc) => ({ sem: sc.semester, cgpa: sc.cgpa })),
            codingProfiles: s.codingProfiles.map((cp) => {
                const activityCount = cp.activityData ? Object.keys(cp.activityData as any).length : 0;
                console.log(`[API] Profile ${cp.platform}: ${activityCount} activity points`);
                return {
                    id: cp.id,
                    platform: cp.platform,
                    handle: cp.handle,
                    stats: JSON.parse(cp.stats),
                    verified: cp.verified,
                    lastSynced: cp.lastSynced,
                    activityData: cp.activityData,
                };
            }),
            badges: s.badges.map((b) => ({
                label: b.label,
                description: b.description,
                icon: b.icon,
                earned: b.earned,
            })),
            skills: s.skills.map((ss) => ss.skill.name),
        });
    } catch (error: any) {
        console.error("Profile error:", error);
        return res.status(500).json({ error: "Failed to load profile" });
    }
});

// GET /api/students/me/attendance — attendance page
router.get("/me/attendance", authenticateToken, requireRole("STUDENT"), async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: {
                student: {
                    include: {
                        attendances: { include: { subject: true } },
                    },
                },
            },
        });

        if (!user?.student) return res.status(404).json({ error: "Student not found" });

        const subjects = user.student.attendances.map((a) => {
            const pct = (a.attended / a.total) * 100;
            return {
                name: a.subject.name,
                code: a.subject.code,
                attended: a.attended,
                total: a.total,
                percentage: Number(pct.toFixed(1)),
                status: pct >= 80 ? "safe" : pct >= 75 ? "warning" : "danger",
            };
        });

        const overallAttended = subjects.reduce((a, s) => a + s.attended, 0);
        const overallTotal = subjects.reduce((a, s) => a + s.total, 0);

        return res.json({
            subjects,
            overall: {
                attended: overallAttended,
                total: overallTotal,
                percentage: Number(((overallAttended / overallTotal) * 100).toFixed(1)),
            },
        });
    } catch (error: any) {
        console.error("Attendance error:", error);
        return res.status(500).json({ error: "Failed to load attendance" });
    }
});

// GET /api/students/me/academics — academic records
router.get("/me/academics", authenticateToken, requireRole("STUDENT"), async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: {
                student: {
                    include: {
                        semesterCGPAs: { orderBy: { semester: "asc" } },
                        academicRecords: { include: { subject: true } },
                    },
                },
            },
        });

        if (!user?.student) return res.status(404).json({ error: "Student not found" });

        return res.json({
            semesterCGPAs: user.student.semesterCGPAs.map((sc) => ({ sem: sc.semester, cgpa: sc.cgpa })),
            records: user.student.academicRecords.map((r) => ({
                subject: r.subject.name,
                code: r.subject.code,
                marks: r.marks,
                maxMarks: r.maxMarks,
                grade: r.grade,
                semester: r.semester,
            })),
        });
    } catch (error: any) {
        console.error("Academics error:", error);
        return res.status(500).json({ error: "Failed to load academics" });
    }
});

// GET /api/students/me/coding-profiles — list linked coding profiles
router.get("/me/coding-profiles", authenticateToken, requireRole("STUDENT"), async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { student: { include: { codingProfiles: true } } },
        });

        if (!user?.student) return res.status(404).json({ error: "Student not found" });

        const platforms = ["LeetCode", "Codeforces", "GitHub", "CodeChef"];
        const linked = user.student.codingProfiles;

        const profiles = platforms.map((platform) => {
            const existing = linked.find((p) => p.platform === platform);
            return {
                id: existing?.id || null,
                platform,
                handle: existing?.handle || "",
                connected: !!existing,
                verified: existing?.verified || false,
                lastSynced: existing?.lastSynced,
                stats: existing ? JSON.parse(existing.stats) : undefined,
            };
        });

        return res.json(profiles);
    } catch (error: any) {
        console.error("Coding profiles error:", error);
        return res.status(500).json({ error: "Failed to load coding profiles" });
    }
});

// GET /api/students/me/verification-code — get or generate student verification code
router.get("/me/verification-code", authenticateToken, requireRole("STUDENT"), async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { student: true },
        });

        if (!user?.student) return res.status(404).json({ error: "Student not found" });

        let code = user.student.verificationCode;
        if (!code) {
            // Generate a code: STU + random 4-char hex from student ID or random
            const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
            code = `STU-${randomPart}`;
            await prisma.student.update({
                where: { id: user.student.id },
                data: { verificationCode: code },
            });
        }

        return res.json({ code });
    } catch (error: any) {
        console.error("Get verification code error:", error);
        return res.status(500).json({ error: "Failed to get verification code" });
    }
});

// POST /api/students/me/coding-profiles — verify handle and link profile
router.post("/me/coding-profiles", authenticateToken, requireRole("STUDENT"), async (req: AuthRequest, res: Response) => {
    try {
        const { platform, handle } = req.body;

        if (!platform || !handle) {
            return res.status(400).json({ error: "Platform and handle are required" });
        }

        // Verify the handle exists on the platform and fetch stats
        const result = await fetchPlatformStats(platform, handle);

        if (!result.verified) {
            return res.status(400).json({ error: `Could not find user "${handle.replace(/^@/, '')}" on ${platform}. Please check the username and try again.` });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { student: true },
        });

        if (!user?.student) return res.status(404).json({ error: "Student not found" });

        // Ownership Verification (Codolio-style bio check)
        // We check if the student's verification code is in the platform's bio
        const vCode = user.student.verificationCode;
        if (vCode) {
            const platformBio = (result.bio || "").toLowerCase();
            const searchCode = vCode.toLowerCase();
            if (!platformBio.includes(searchCode)) {
                return res.status(400).json({
                    error: `Ownership verification failed. Please add your verification code "${vCode}" to your ${platform} bio/about section and try again.`,
                    verificationCode: vCode,
                    platformBio: result.bio // For debugging if needed
                });
            }
        }

        // Check if profile for this platform already exists
        const existing = await prisma.codingProfile.findFirst({
            where: { studentId: user.student.id, platform },
        });

        const statsJson = JSON.stringify(result.stats);

        let profile;
        if (existing) {
            profile = await prisma.codingProfile.update({
                where: { id: existing.id },
                data: {
                    handle: handle.replace(/^@/, ''),
                    stats: statsJson,
                    verified: true,
                    lastSynced: new Date(),
                    activityData: result.activity || {},
                },
            });
        } else {
            profile = await prisma.codingProfile.create({
                data: {
                    studentId: user.student.id,
                    platform,
                    handle: handle.replace(/^@/, ''),
                    stats: statsJson,
                    verified: true,
                    lastSynced: new Date(),
                    activityData: result.activity || {},
                },
            });
        }

        return res.json({
            id: profile.id,
            platform: profile.platform,
            handle: profile.handle,
            connected: true,
            verified: true,
            stats: result.stats,
        });
    } catch (error: any) {
        console.error("Link profile error:", error);
        return res.status(500).json({ error: "Failed to link profile" });
    }
});

// POST /api/students/me/coding-profiles/refresh — re-fetch stats for all linked profiles
router.post("/me/coding-profiles/refresh", authenticateToken, requireRole("STUDENT"), async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { student: { include: { codingProfiles: true } } },
        });

        if (!user?.student) return res.status(404).json({ error: "Student not found" });

        const updated = [];
        for (const cp of user.student.codingProfiles) {
            const result = await fetchPlatformStats(cp.platform, cp.handle);
            if (result.verified) {
                await prisma.codingProfile.update({
                    where: { id: cp.id },
                    data: {
                        stats: JSON.stringify(result.stats),
                        activityData: result.activity || {},
                        lastSynced: new Date(),
                    },
                });
                updated.push({ platform: cp.platform, handle: cp.handle, stats: result.stats });
            } else {
                updated.push({ platform: cp.platform, handle: cp.handle, stats: JSON.parse(cp.stats) });
            }
        }

        return res.json({ refreshed: updated.length, profiles: updated });
    } catch (error: any) {
        console.error("Refresh profiles error:", error);
        return res.status(500).json({ error: "Failed to refresh profiles" });
    }
});

// DELETE /api/students/me/coding-profiles/:id — unlink a coding profile
router.delete("/me/coding-profiles/:id", authenticateToken, requireRole("STUDENT"), async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { student: true },
        });

        if (!user?.student) return res.status(404).json({ error: "Student not found" });

        // Make sure the profile belongs to this student
        const profile = await prisma.codingProfile.findFirst({
            where: { id: req.params.id as string, studentId: user.student.id },
        });

        if (!profile) return res.status(404).json({ error: "Profile not found" });

        await prisma.codingProfile.delete({ where: { id: profile.id } });

        return res.json({ success: true });
    } catch (error: any) {
        console.error("Unlink profile error:", error);
        return res.status(500).json({ error: "Failed to unlink profile" });
    }
});

// GET /api/students/:id — specific student (for mentors)
router.get("/:id", authenticateToken, requireRole("MENTOR"), async (req: AuthRequest, res: Response) => {
    try {
        const student = await prisma.student.findUnique({
            where: { id: req.params.id as string },
            include: {
                user: { select: { name: true, email: true } },
                semesterCGPAs: { orderBy: { semester: "asc" } },
                academicRecords: { include: { subject: true } },
                attendances: { include: { subject: true } },
                codingProfiles: true,
                badges: true,
                skills: { include: { skill: true } },
            },
        });

        if (!student) return res.status(404).json({ error: "Student not found" });

        return res.json({
            profile: {
                id: student.id,
                name: (student as any).user.name,
                email: (student as any).user.email,
                enrollment: student.enrollment,
                section: student.section,
                semester: student.semester,
                branch: student.branch,
                year: student.year,
                cgpa: student.cgpa,
                rank: student.rank,
            },
            semesterCGPAs: (student as any).semesterCGPAs.map((sc: any) => ({ sem: sc.semester, cgpa: sc.cgpa })),
            attendance: (student as any).attendances.map((a: any) => ({
                subject: a.subject.name,
                code: a.subject.code,
                attended: a.attended,
                total: a.total,
                percentage: Number(((a.attended / a.total) * 100).toFixed(1)),
            })),
            codingProfiles: (student as any).codingProfiles.map((cp: any) => ({
                platform: cp.platform,
                handle: cp.handle,
                stats: JSON.parse(cp.stats),
                activityData: cp.activityData,
            })),
            badges: (student as any).badges.map((b: any) => ({ label: b.label, earned: b.earned })),
            skills: (student as any).skills.map((ss: any) => ss.skill.name),
            academicRecords: (student as any).academicRecords.map((r: any) => ({
                subject: r.subject.name,
                code: r.subject.code,
                marks: r.marks,
                maxMarks: r.maxMarks,
                grade: r.grade,
                semester: r.semester,
            })),
        });
    } catch (error: any) {
        console.error("Student detail error:", error);
        return res.status(500).json({ error: "Failed to load student" });
    }
});

export default router;
