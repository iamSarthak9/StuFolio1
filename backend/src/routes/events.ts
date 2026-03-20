import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest, authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

// GET /api/events — get events (optional month/year filter)
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { month, year } = req.query;

        let where: any = {};

        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
            where.date = { gte: startDate, lte: endDate };
        }

        // 1. Fetch local events from DB
        const dbEvents = await prisma.event.findMany({
            where,
            orderBy: { date: "asc" },
        });

        // 2. Fetch external contests from multiple reliable sources
        try {
            const now = new Date();
            const requestedDate = month && year ? new Date(Number(year), Number(month) - 1, 1) : now;
            
            // Check if we need to refresh cache (if fewer than 10 external events in DB for requested range)
            const existingExternalCount = await prisma.event.count({
                where: {
                    ...where,
                    platform: { not: null }
                }
            });

            if (existingExternalCount < 10) { 
                const newExternal: any[] = [];
                
                // --- SOURCE A: Codeforces Official API (Very Reliable) ---
                try {
                    const cfResponse = await (global as any).fetch("https://codeforces.com/api/contest.list?gym=false");
                    if (cfResponse.ok) {
                        const data = await cfResponse.json();
                        if (data.status === "OK") {
                            const cfContests = data.result
                                .filter((c: any) => c.phase === "BEFORE" || c.phase === "CODING")
                                .map((c: any) => ({
                                    title: c.name,
                                    description: `${Math.floor(c.durationSeconds / 3600)}h ${Math.floor((c.durationSeconds % 3600) / 60)}m`,
                                    date: new Date(c.startTimeSeconds * 1000),
                                    type: "contest",
                                    platform: "Codeforces",
                                    link: `https://codeforces.com/contests/${c.id}`,
                                }));
                            newExternal.push(...cfContests);
                        }
                    }
                } catch (e) { console.error("CF API Error:", e); }

                // --- SOURCE B: Kontests (Fallback for Multi-platform) ---
                try {
                    const kontestsResponse = await (global as any).fetch("https://kontests.net/api/v1/all");
                    if (kontestsResponse.ok) {
                        const contests = await kontestsResponse.json();
                        const targets = ["LeetCode", "CodeChef", "AtCoder", "HackerRank"];
                        const kContests = contests
                            .filter((c: any) => targets.includes(c.site.trim()) && !newExternal.some(e => e.title === c.name))
                            .map((c: any) => ({
                                title: c.name,
                                description: `${Math.floor(parseInt(c.duration) / 3600)}h ${Math.floor((parseInt(c.duration) % 3600) / 60)}m`,
                                date: new Date(c.start_time),
                                type: "contest",
                                platform: c.site,
                                link: c.url,
                            }));
                        newExternal.push(...kContests);
                    }
                } catch (e) { console.error("Kontests Error:", e); }

                // Batch Cache
                for (const ext of newExternal) {
                    try {
                        const exists = await prisma.event.findFirst({
                            where: { title: ext.title, date: ext.date, platform: ext.platform }
                        });
                        if (!exists) {
                            await prisma.event.create({ data: ext });
                        }
                    } catch (err) { /* ignore duplicates */ }
                }
            }

            // Return everything from DB (Cached + Local)
            return res.json(await prisma.event.findMany({
                where,
                orderBy: { date: "asc" },
            }));

        } catch (apiErr) {
            console.error("Master fetch/cache error:", apiErr);
            return res.json(dbEvents);
        }
    } catch (error: any) {
        console.error("Events error:", error);
        return res.status(500).json({ error: "Failed to load events" });
    }
});

// POST /api/events — create event (mentor only)
router.post("/", authenticateToken, requireRole("MENTOR"), async (req: Request, res: Response) => {
    try {
        const { title, description, date, type, platform, link } = req.body;

        if (!title || !date || !type) {
            return res.status(400).json({ error: "title, date, and type are required" });
        }

        const event = await prisma.event.create({
            data: {
                title,
                description,
                date: new Date(date),
                type,
                platform,
                link,
            },
        });

        return res.status(201).json(event);
    } catch (error: any) {
        console.error("Create event error:", error);
        return res.status(500).json({ error: "Failed to create event" });
    }
});

export default router;
