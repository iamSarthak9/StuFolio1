import puppeteer, { Browser, Page } from "puppeteer";
import prisma from "../lib/prisma";
import crypto from "crypto";

// Simple in-memory storage for active sync sessions (preserving the browser/page for captcha)
const activeSyncSessions = new Map<string, { browser: Browser; page: Page; createdAt: number }>();

// Cleanup stale sessions every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [id, session] of activeSyncSessions.entries()) {
        if (now - session.createdAt > 10 * 60 * 1000) {
            session.browser.close().catch(() => {});
            activeSyncSessions.delete(id);
        }
    }
}, 10 * 60 * 1000);

export class AcademicSyncService {
    /**
     * Starts a sync session by navigating to the login page and extracting the captcha.
     */
    static async getCaptcha(): Promise<{ syncId: string; captchaBase64: string }> {
        let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

        // Special case for Render: if not found, try to find it in the cache
        if (!executablePath && process.env.RENDER) {
            executablePath = "/opt/render/.cache/puppeteer/chrome/linux-146.0.7680.153/chrome-linux64/chrome";
            console.log("[Sync] Render detected, using fallback path:", executablePath);
        }

        const browser = await puppeteer.launch({
            executablePath,
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        });

        try {
            const page = await browser.newPage();
            
            // Set a realistic user agent to avoid bot detection in deployment
            await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

            console.log("[Sync] Navigating to GGSIPU portal...");
            await page.goto("https://examweb.ggsipu.ac.in/web/login.jsp", { 
                waitUntil: "networkidle2",
                timeout: 30000 // Increase timeout to 30s for slower deployment networks
            });

            // Wait for the captcha image to be available
            console.log("[Sync] Waiting for captcha image...");
            await page.waitForSelector("#captchaImage", { timeout: 15000 });
            const captchaElement = await page.$("#captchaImage");
            
            if (!captchaElement) {
                throw new Error("Could not find captcha image on GGSIPU portal");
            }

            const captchaBase64 = await captchaElement.screenshot({ encoding: "base64" });
            const syncId = crypto.randomUUID();

            activeSyncSessions.set(syncId, { browser, page, createdAt: Date.now() });

            return { syncId, captchaBase64: `data:image/png;base64,${captchaBase64}` };
        } catch (error) {
            await browser.close();
            throw error;
        }
    }

    /**
     * Performs the full sync using provided credentials and captcha.
     */
    static async syncForStudent(
        studentId: string,
        syncId: string,
        username: string,
        password: string,
        captcha: string
    ) {
        const session = activeSyncSessions.get(syncId);
        if (!session) {
            throw new Error("Sync session expired or invalid. Please try again.");
        }

        const { browser, page } = session;

        try {
            await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            await page.setViewport({ width: 1280, height: 800 });

            // 1. Fill login form
            await page.type("#username", username);
            await page.type("#passwd", password);
            await page.type("#captcha", captcha);

            // 2. Click login
            console.log(`[Sync] Attempting login for ${username}...`);
            await Promise.all([
                page.click("input[type='submit'].btn-login"),
                page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {
                    console.warn("[Sync] Navigation timeout, checking current page state...");
                }),
            ]);

            // Check if login failed (still on login page or seeing error)
            const pageInfo = await page.evaluate(() => {
                const doc = (globalThis as any).document;
                const loc = (globalThis as any).location;
                return {
                    title: doc.title,
                    url: loc.href,
                    error: doc.querySelector(".error")?.textContent || doc.querySelector("#error")?.textContent || null,
                    isLogin: doc.title.toLowerCase().includes("login") || !!doc.querySelector("#username")
                };
            });

            console.log(`[Sync] Page after login attempt: ${pageInfo.title} (${pageInfo.url})`);

            if (pageInfo.isLogin) {
                const errorMsg = pageInfo.error || "Login failed. Please check your credentials and captcha.";
                console.error(`[Sync] Login failed: ${errorMsg}`);
                throw new Error(errorMsg);
            }

            // 3. Navigate to Marks/Results page
            console.log("[Sync] Navigating to dashboard for results...");
            await page.goto("https://examweb.ggsipu.ac.in/web/student/studenthome.jsp", { 
                waitUntil: "networkidle2",
                timeout: 30000 
            }).catch(() => null);

            // 4. Loop through all Semester options and Fetch
            const allScrapedData: any[] = [];
            
            await page.waitForSelector("#euno", { timeout: 15000 }).catch(() => null);
            const options = await page.evaluate(() => {
                const sel = (globalThis as any).document.querySelector("#euno");
                if (!sel) return [];
                return Array.from(sel.options)
                    .map((o: any) => ({ value: o.value, text: o.innerText.trim() }))
                    .filter(o => o.value && o.value !== "0");
            });

            console.log(`[Sync] Found ${options.length} semesters to sync.`);

            for (const option of options) {
                console.log(`[Sync] Fetching results for ${option.text}...`);
                await page.select("#euno", option.value);
                await page.click("input[type='submit'], button.btn-primary, #btnGetResult").catch(() => null);
                await new Promise(resolve => setTimeout(resolve, 3000));

                const semesterData = await page.evaluate((semName) => {
                    const doc = (globalThis as any).document;
                    const tables = Array.from(doc.querySelectorAll("table")) as any[];
                    const marksTable = tables.find(t => t.innerText.toLowerCase().includes("paper code") && t.innerText.toLowerCase().includes("total"));
                    
                    if (!marksTable) return [];

                    const rows = Array.from(marksTable.querySelectorAll("tr"));
                    const dataRows = rows.filter(r => {
                        const cells = (r as any).cells;
                        return cells.length >= 6 && !isNaN(parseInt(cells[0].innerText.trim()));
                    });

                    return dataRows.map(row => {
                        const cols = Array.from((row as any).cells).map((c: any) => c.innerText.trim());
                        return {
                            code: cols[1],
                            name: cols[2], 
                            internalMarks: parseFloat(cols[3]) || 0,
                            externalMarks: parseFloat(cols[4]) || 0,
                            marks: parseFloat(cols[5]) || 0,
                            grade: null,
                            semester: semName
                        };
                    });
                }, option.text);

                allScrapedData.push(...semesterData);
            }

            console.log(`[Sync] Total scraped marks: ${allScrapedData.length}`);

            if (allScrapedData.length === 0) {
                throw new Error("Could not find any marks data on the portal.");
            }

            // 5. Update Database
            await this.updateDatabaseWithScrapedData(studentId, allScrapedData);

            return { success: true, count: allScrapedData.length };
        } catch (error: any) {
            console.error("[Sync] Error during flow:", error.message || error);
            throw error;
        } finally {
            await browser.close();
            activeSyncSessions.delete(syncId);
        }
    }
    private static async updateDatabaseWithScrapedData(studentId: string, data: any[]) {
        for (const item of data) {
            // Find or create subject
            const subject = await prisma.subject.upsert({
                where: { code: item.code },
                create: {
                    code: item.code,
                    name: item.name,
                    semester: item.semester
                },
                update: {
                    name: item.name,
                    semester: item.semester
                }
            });

            await prisma.academicRecord.upsert({
                where: {
                    studentId_subjectId_semester: {
                        studentId,
                        subjectId: subject.id,
                        semester: item.semester
                    }
                },
                create: {
                    studentId,
                    subjectId: subject.id,
                    internalMarks: item.internalMarks,
                    externalMarks: item.externalMarks,
                    marks: item.marks,
                    grade: item.grade,
                    semester: item.semester,
                    maxMarks: 100
                },
                update: {
                    internalMarks: item.internalMarks,
                    externalMarks: item.externalMarks,
                    marks: item.marks,
                    grade: item.grade
                }
            });
        }

        // Recalculate CGPA
        const allRecords = await prisma.academicRecord.findMany({
            where: { studentId }
        });

        if (allRecords.length > 0) {
            // Simple calculation: Avg of marks / 10
            const totalMarksPercent = allRecords.reduce((sum, r) => sum + (r.marks / r.maxMarks), 0);
            const avgPercent = (totalMarksPercent / allRecords.length) * 100;
            const newCGPA = Number((avgPercent / 10).toFixed(2));

            await prisma.student.update({
                where: { id: studentId },
                data: { cgpa: newCGPA }
            });

            // Update semester-wise CGPA
            const semesters = [...new Set(allRecords.map(r => r.semester))];
            for (const sem of semesters) {
                const semRecords = allRecords.filter(r => r.semester === sem);
                const semTotal = semRecords.reduce((sum, r) => sum + (r.marks / r.maxMarks), 0);
                const semAvg = (semTotal / semRecords.length) * 10;
                
                await prisma.semesterCGPA.upsert({
                    where: { studentId_semester: { studentId, semester: sem } },
                    create: { studentId, semester: sem, cgpa: Number(semAvg.toFixed(2)) },
                    update: { cgpa: Number(semAvg.toFixed(2)) }
                });
            }
        }
    }
}
