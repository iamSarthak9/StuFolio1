import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { JWT_SECRET } from "../middleware/auth";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
    try {
        const { email, password, name, role, enrollment, section, semester, branch, year, department, designation } = req.body;

        if (!email || !password || !name || !role) {
            return res.status(400).json({ error: "email, password, name, and role are required" });
        }

        if (!["STUDENT", "MENTOR"].includes(role)) {
            return res.status(400).json({ error: "role must be STUDENT or MENTOR" });
        }

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                ...(role === "STUDENT" && {
                    student: {
                        create: {
                            enrollment: enrollment || `STU-${Date.now()}`,
                            section: section || "CS-A",
                            semester: semester || "1st Semester",
                            branch: branch || "Computer Science & Engineering",
                            year: year || "1st Year",
                        },
                    },
                }),
                ...(role === "MENTOR" && {
                    mentor: {
                        create: {
                            department: department || "Computer Science",
                            designation: designation || "Assistant Professor",
                            section: section || "CS-A",
                        },
                    },
                }),
            },
            include: {
                student: true,
                mentor: true,
            },
        });

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

        return res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                studentId: user.student?.id,
                mentorId: user.mentor?.id,
            },
        });
    } catch (error: any) {
        console.error("Register error:", error);
        return res.status(500).json({ error: "Registration failed" });
    }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "email and password are required" });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { student: true, mentor: true },
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                studentId: user.student?.id,
                mentorId: user.mentor?.id,
            },
        });
    } catch (error: any) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Login failed" });
    }
});

// GET /api/auth/me
router.get("/me", async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Missing or invalid token" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { student: true, mentor: true },
        });

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        return res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                studentId: user.student?.id,
                mentorId: user.mentor?.id,
            },
        });
    } catch (error) {
        return res.status(401).json({ error: "Invalid session" });
    }
});

export default router;
