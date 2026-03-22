import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest, authenticateToken } from "../middleware/auth";

const router = Router();

// Require HOD or PRINCIPAL role
const requireAdmin = (req: AuthRequest, res: Response, next: any) => {
    if (!req.user || !["HOD", "PRINCIPAL"].includes(req.user.role)) {
        return res.status(403).json({ error: "Access denied. Requires Admin role." });
    }
    next();
};

// GET /api/admin/students
router.get("/students", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { search, semester, branch, section } = req.query;

        const where: any = {};
        if (semester) where.semester = String(semester);
        if (branch) where.branch = String(branch);
        if (section) where.section = String(section);
        if (search) {
            where.OR = [
                { user: { name: { contains: String(search), mode: 'insensitive' } } },
                { enrollment: { contains: String(search), mode: 'insensitive' } }
            ];
        }

        const students = await prisma.student.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
            },
            orderBy: { enrollment: "asc" },
            take: 50 // limit for safety
        });

        return res.json(students.map(s => ({
            id: s.id,
            name: s.user.name,
            email: s.user.email,
            enrollment: s.enrollment,
            branch: s.branch,
            semester: s.semester,
            section: s.section,
            cgpa: s.cgpa
        })));
    } catch (error: any) {
        console.error("Admin students error:", error);
        return res.status(500).json({ error: "Failed to load students" });
    }
});

// GET /api/admin/students/:id
router.get("/students/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const student = await prisma.student.findUnique({
            where: { id: req.params.id as string },
            include: {
                user: { select: { name: true, email: true, createdAt: true } },
                attendances: { include: { subject: true } },
                academicRecords: { include: { subject: true } },
                codingProfiles: true,
                badges: true
            }
        });

        if (!student) return res.status(404).json({ error: "Student not found" });

        return res.json(student);
    } catch (error: any) {
        console.error("Admin student detail error:", error);
        return res.status(500).json({ error: "Failed to load student" });
    }
});

export default router;
