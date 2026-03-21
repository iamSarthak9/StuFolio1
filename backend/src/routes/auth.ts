import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import prisma from "../lib/prisma";
import { JWT_SECRET } from "../middleware/auth";
import { parseStudentData } from "../utils/studentParser";

const client = jwksClient({
    jwksUri: `https://login.microsoftonline.com/${process.env.MSAL_TENANT_ID}/discovery/v2.0/keys`
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    client.getSigningKey(header.kid, function (err, key) {
        if (err) return callback(err);
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
}

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
                            section: section || "CSE-B",
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
                            section: section || "CSE-B",
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
        const { email, password, role } = req.body;

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

        if (role && user.role !== role) {
            return res.status(401).json({
                error: `This account is registered as a ${user.role.toLowerCase()}. Please select the correct portal.`
            });
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

// POST /api/auth/msal
router.post("/msal", async (req: Request, res: Response) => {
    console.log("[Auth] MSAL Login request received");
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: "Missing ID token" });

        jwt.verify(
            idToken,
            getKey,
            {
                audience: process.env.MSAL_CLIENT_ID,
                issuer: `https://login.microsoftonline.com/${process.env.MSAL_TENANT_ID}/v2.0`,
            },
            async (err, decoded) => {
                if (err || !decoded) {
                    console.error("Token verification failed:", err);
                    return res.status(401).json({ error: "Invalid or expired Microsoft token" });
                }

                const payload = decoded as any;
                const email = (payload.preferred_username || payload.email || payload.upn || "").toLowerCase();
                console.log(`[MSAL] Verified token for: ${email}`);

                if (!email) {
                    console.error("[MSAL] No email found in payload:", payload);
                    return res.status(400).json({ error: "Email not found in token" });
                }

                if (!email.endsWith("@bpitindia.edu.in")) {
                    console.warn(`[MSAL] Domain mismatch: ${email}`);
                    return res.status(403).json({ error: "Please login with your college ID (@bpitindia.edu.in)" });
                }

                const enrollmentNumber = payload.employeeId || payload.extension_enrollmentNumber || payload.jobTitle || "00000000000";
                console.log(`[MSAL] Enrollment claim: ${enrollmentNumber}`);

                const parsed = parseStudentData(enrollmentNumber, email);
                console.log(`[MSAL] Parsed student data:`, parsed);

                const name = payload.name || email.split("@")[0];

                let user = await prisma.user.findUnique({
                    where: { email },
                    include: { student: true, mentor: true }
                });

                console.log(`[MSAL] User lookup for ${email}: ${user ? "Found" : "Not Found"}`);

                if (!user) {
                    // Check if another student already has this enrollment
                    const existingEnrollment = await prisma.student.findUnique({
                        where: { enrollment: parsed.enrollmentString }
                    });

                    if (existingEnrollment) {
                        return res.status(400).json({
                            error: `The enrollment number ${parsed.enrollmentString} is already registered with another account. Please contact support or use the existing account.`
                        });
                    }

                    // Generate random fallback password
                    const randomPassword = require("crypto").randomBytes(16).toString("hex");
                    const hashedPassword = await bcrypt.hash(randomPassword, 10);

                    try {
                        user = await prisma.user.create({
                            data: {
                                email,
                                password: hashedPassword,
                                name,
                                role: "STUDENT",
                                student: {
                                    create: {
                                        enrollment: parsed.enrollmentString,
                                        section: parsed.section,
                                        semester: parsed.semester,
                                        branch: parsed.branch,
                                        year: parsed.year,
                                    }
                                }
                            },
                            include: { student: true, mentor: true }
                        });
                    } catch (createErr: any) {
                        console.error("[MSAL] Error creating unified user:", createErr);
                        return res.status(500).json({ error: "Failed to create institutional user account." });
                    }
                } else if (user.role === "STUDENT" && !user.student) {
                    console.log(`[MSAL] User ${email} exists but missing student record. Creating...`);

                    // Check enrollment conflict even for existing user without student record
                    const existingEnrollment = await prisma.student.findUnique({
                        where: { enrollment: parsed.enrollmentString }
                    });

                    if (existingEnrollment) {
                        return res.status(400).json({
                            error: `Your institutional enrollment (${parsed.enrollmentString}) is already linked to another email address.`
                        });
                    }

                    await prisma.student.create({
                        data: {
                            userId: user.id,
                            enrollment: parsed.enrollmentString,
                            section: parsed.section,
                            semester: parsed.semester,
                            branch: parsed.branch,
                            year: parsed.year,
                        }
                    });
                } else if (user.role === "STUDENT" && user.student) {
                    console.log(`[MSAL] Updating existing student record for ${email}`);
                    // Update student info if it was previously hardcoded/defaulted
                    await prisma.student.update({
                        where: { userId: user.id },
                        data: {
                            enrollment: parsed.enrollmentString,
                            section: parsed.section,
                            semester: parsed.semester,
                            branch: parsed.branch,
                            year: parsed.year,
                        }
                    });
                }

                // Refresh user object to ensure we have the updated student/mentor data
                user = await prisma.user.findUnique({
                    where: { id: user.id },
                    include: { student: true, mentor: true }
                }) as any;

                if (!user) {
                    console.error(`[MSAL] Failed to refresh user ${email}`);
                    return res.status(500).json({ error: "Failed to refresh user after setup" });
                }

                console.log(`[MSAL] Session created for ${user.email} (ID: ${user.id})`);
                const sessionToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

                return res.json({
                    token: sessionToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        studentId: user.student?.id,
                        mentorId: user.mentor?.id,
                    },
                });
            }
        );
    } catch (e) {
        console.error("MSAL Route error:", e);
        return res.status(500).json({ error: "Internal server error during MSAL login" });
    }
});

export default router;
