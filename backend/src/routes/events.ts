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

        // 2. Fetch external contests from Kontests API
        let externalEvents: any[] = [];
        try {
            const response = await (global as any).fetch("https://kontests.net/api/v1/all");
            if (response.ok) {
                const contests = await response.json() as any;
                
                // Platforms we care about
                const targets = ["LeetCode", "CodeForces", "CodeChef", "HackerRank", "AtCoder"];
                
                externalEvents = contests
                    .filter((c: any) => targets.includes(c.site))
                    .map((c: any) => {
                        const durationSeconds = parseInt(c.duration);
                        const h = Math.floor(durationSeconds / 3600);
                        const m = Math.floor((durationSeconds % 3600) / 60);
                        const durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

                        return {
                            id: `ext-${c.name}-${c.start_time}`,
                            title: c.name,
                            description: `Platform: ${c.site} | Status: ${c.status}`,
                            date: new Date(c.start_time),
                            type: "contest",
                            platform: c.site,
                            link: c.url,
                            duration: durationStr,
                        };
                    });
                
                // If filtering by date, apply it to external events too
                if (month && year) {
                    const startDate = new Date(Number(year), Number(month) - 1, 1);
                    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
                    externalEvents = externalEvents.filter(e => e.date >= startDate && e.date <= endDate);
                }
            }
        } catch (apiErr) {
            console.error("Failed to fetch external contests (API Down/Blocked):", apiErr);
            // Fallback for demo purposes if API is down
            externalEvents = [
                {
                    id: "fb-lc-weekly",
                    title: "LeetCode Weekly Contest",
                    description: "Weekly coding competition on LeetCode",
                    date: new Date(new Date().setDate(new Date().getDate() + (7 - new Date().getDay()) % 7)), // Next Sunday
                    type: "contest",
                    platform: "LeetCode",
                    link: "https://leetcode.com/contest",
                    duration: "1h 30m"
                },
                {
                    id: "fb-cf-div2",
                    title: "Codeforces Round (Div. 2)",
                    description: "Regular competitive programming round",
                    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
                    type: "contest",
                    platform: "Codeforces",
                    link: "https://codeforces.com/contests",
                    duration: "2h 0m"
                }
            ];
        }

        // 3. Merge and Sort
        const allEvents = [...dbEvents, ...externalEvents].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        return res.json(allEvents);
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
