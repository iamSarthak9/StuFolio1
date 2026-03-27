import puppeteer, { Browser, Page } from "puppeteer";
import prisma from "../lib/prisma";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import syllabusCredits from "../data/syllabus_credits.json";

// Simple in-memory storage for active sync sessions (preserving the browser/page for captcha)
const activeSyncSessions = new Map<string, { browser: Browser; page: Page; createdAt: number }>();

// Cleanup stale sessions every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [id, session] of activeSyncSessions.entries()) {
        if (now - session.createdAt > 10 * 60 * 1000) {
            session.page.close().catch(() => {});
            activeSyncSessions.delete(id);
        }
    }
}, 10 * 60 * 1000);

const findChromeInRenderCache = () => {
    // Try project-local cache first (installed via build.sh)
    const localCache = path.join(process.cwd(), ".puppeteer-cache", "chrome");
    const globalCache = "/opt/render/.cache/puppeteer/chrome";
    
    const searchDirs = [localCache, globalCache].filter(d => fs.existsSync(d));
    
    if (searchDirs.length === 0) return null;

    try {
        // Recursively find the first file named 'chrome'
        const findExec = (dir: string): string | null => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                if (fs.statSync(fullPath).isDirectory()) {
                    const found = findExec(fullPath);
                    if (found) return found;
                } else if (file === "chrome" || file === "google-chrome") {
                    return fullPath;
                }
            }
            return null;
        };

        for (const dir of searchDirs) {
            const found = findExec(dir);
            if (found) return found;
        }
        return null;
    } catch (e) {
        console.error("[Sync] Error searching for chrome in cache:", e);
        return null;
    }
};


export class AcademicSyncService {
    private static browserInstance: Browser | null = null;

    private static getGradePoint(marks: number): number {
        if (marks >= 90) return 10;
        if (marks >= 75) return 9;
        if (marks >= 65) return 8;
        if (marks >= 55) return 7;
        if (marks >= 50) return 6;
        if (marks >= 45) return 5;
        if (marks >= 40) return 4;
        return 0;
    }

    private static getLetterGrade(marks: number): string {
        if (marks >= 90) return "O";
        if (marks >= 75) return "A+";
        if (marks >= 65) return "A";
        if (marks >= 55) return "B+";
        if (marks >= 50) return "B";
        if (marks >= 45) return "C";
        if (marks >= 40) return "P";
        return "F";
    }

    private static async getBrowser(): Promise<Browser> {
        if (this.browserInstance) {
            try {
                // Check if browser is still responsive
                await this.browserInstance.version();
                return this.browserInstance;
            } catch (e) {
                console.warn("[Sync] Singleton browser disconnected or unresponsive, restarting...");
                this.browserInstance = null;
            }
        }

        let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

        if (!executablePath && process.env.RENDER) {
            executablePath = findChromeInRenderCache() || undefined;
        }

        console.log("[Sync] Launching singleton browser instance...");
        this.browserInstance = await puppeteer.launch({
            executablePath,
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        });

        return this.browserInstance;
    }

    /**
     * Pre-launches the browser to avoid delay on first request.
     */
    static async warmup() {
        try {
            console.log("[Sync] Warming up academic sync service...");
            await this.getBrowser();
        } catch (e) {
            console.error("[Sync] Warmup failed:", e);
        }
    }

    /**
     * Starts a sync session by navigating to the login page and extracting the captcha.
     */
    static async getCaptcha(): Promise<{ syncId: string; captchaBase64: string }> {
        const browser = await this.getBrowser();

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
            // Don't close the singleton browser on error, just throw
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
                
                // Capture login failure screenshot for debugging
                const screenshotPath = path.join(process.cwd(), `sync_error_login_${Date.now()}.png`);
                await page.screenshot({ path: screenshotPath }).catch(() => {});
                console.log(`[Sync] Login failure screenshot saved to: ${screenshotPath}`);
                
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
                    .filter(o => o.value && o.value !== "0" && o.text.toUpperCase() !== "ALL" && !o.text.toLowerCase().includes("all semesters"));
            });

            console.log(`[Sync] Found ${options.length} semesters to sync. Fetching sequentially for stability...`);

            // 4. Fetch semesters sequentially to preserve portal session state
            for (const option of options) {
                console.log(`[Sync] Fetching results for ${option.text}...`);
                
                try {
                    console.log(`[Sync]   - Selecting ${option.text}...`);
                    await page.waitForSelector("#euno", { timeout: 10000 });
                    await page.select("#euno", option.value);
                    
                    console.log(`[Sync]   - Clicking submit for ${option.text}...`);
                    await Promise.all([
                        page.click("input[type='submit'], button.btn-primary, #btnGetResult").catch(() => null),
                        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {
                            console.warn(`[Sync]   - Navigation timeout for ${option.text}, proceeding to scrape anyway.`);
                        })
                    ]);

                    const semesterData = await page.evaluate((semName) => {
                        const doc = (globalThis as any).document;
                        const tables = Array.from(doc.querySelectorAll("table")) as any[];
                        
                        // DEBUG: log all table texts to help diagnose portal structure changes
                        const tableTexts = tables.map((t: any, i: number) => `[${i}]: ${t.innerText.substring(0, 100).replace(/\n/g, ' ')}`);
                        console.log('[Scraper] Tables found on page:', JSON.stringify(tableTexts));
                        
                        const marksTable = tables.find((t: any) => {
                            const text = t.innerText.toLowerCase();
                            return (text.includes("paper code") || text.includes("subject code") || text.includes("paper")) 
                                && (text.includes("total") || text.includes("marks"));
                        });
                        
                        if (!marksTable) return { rows: [], debug: tableTexts };

                        const rows = Array.from(marksTable.querySelectorAll("tr"));
                        if (rows.length < 2) return { rows: [], debug: tableTexts };
                        const headers = Array.from((rows[0] as any).cells).map((c: any) => c.innerText.trim().toLowerCase());
                        console.log('[Scraper] Table headers:', JSON.stringify(headers));
                        
                        const codeIdx = headers.findIndex((h: string) => h.includes("code"));
                        const nameIdx = headers.findIndex((h: string) => h.includes("paper name") || h.includes("subject") || h.includes("name"));
                        const internalIdx = headers.findIndex((h: string) => h.includes("internal"));
                        const externalIdx = headers.findIndex((h: string) => h.includes("external"));
                        const totalIdx = headers.findIndex((h: string) => h.includes("total") || h.includes("marks"));
                        const creditsIdx = headers.findIndex((h: string) => h.includes("credit") || h.includes("cr"));

                        const dataRows = rows.slice(1).filter((r: any) => {
                            const cells = (r as any).cells;
                            if (cells.length < 3) return false;
                            const firstCell = cells[0].innerText.trim();
                            // Accept rows that start with a number OR have a subject-code-looking value
                            return !isNaN(parseInt(firstCell)) || /^[A-Z]{2,}/.test(firstCell);
                        });

                        return {
                            rows: dataRows.map((row: any) => {
                                const cols = Array.from((row as any).cells).map((c: any) => c.innerText.trim());
                                return {
                                    code: codeIdx !== -1 ? cols[codeIdx] : cols[1],
                                    name: nameIdx !== -1 ? cols[nameIdx] : cols[2], 
                                    internalMarks: internalIdx !== -1 ? parseFloat(cols[internalIdx]) || 0 : 0,
                                    externalMarks: externalIdx !== -1 ? parseFloat(cols[externalIdx]) || 0 : 0,
                                    marks: totalIdx !== -1 ? parseFloat(cols[totalIdx]) || 0 : 0,
                                    credits: creditsIdx !== -1 ? parseFloat(cols[creditsIdx]) || 4 : 4,
                                    semester: semName
                                };
                            }),
                            debug: tableTexts
                        };
                    }, option.text);
                    
                    const parsedRows = (semesterData as any).rows || semesterData;
                    if ((semesterData as any).debug) {
                        console.log(`[Sync] Page debug for ${option.text} - tables:`, JSON.stringify((semesterData as any).debug));
                    }

                    console.log(`[Sync] Scraped ${parsedRows.length} marks for ${option.text}.`);
                    allScrapedData.push(...parsedRows);

                    // Slight delay to be polite to the server
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (semErr: any) {
                    console.error(`[Sync] Error fetching ${option.text}:`, semErr.message || semErr);
                }
            }

            console.log(`[Sync] Total scraped marks from portal: ${allScrapedData.length}`);

            if (allScrapedData.length === 0) {
                // Capture screenshot when no marks are found
                const screenshotPath = path.join(process.cwd(), `sync_error_nomarks_${Date.now()}.png`);
                await page.screenshot({ path: screenshotPath }).catch(() => {});
                console.log(`[Sync] No marks found screenshot saved to: ${screenshotPath}`);
                
                throw new Error("Could not find any marks data on the portal. This could be due to a change in the portal's structure.");
            }

            // 5. Update Database
            await this.updateDatabaseWithScrapedData(studentId, allScrapedData);

            return { success: true, count: allScrapedData.length };
        } catch (error: any) {
            console.error("[Sync] Error during flow:", error.message || error);
            throw error;
        } finally {
            await page.close().catch(() => {});
            activeSyncSessions.delete(syncId);
        }
    }
    private static async updateDatabaseWithScrapedData(studentId: string, data: any[]) {
        console.log(`[Sync] Updating database with ${data.length} records for student ${studentId}...`);

        // Use transaction for atomicity with batch operations
        await prisma.$transaction(async (tx) => {
            console.log(`[Sync] Starting optimized DB transaction for ${data.length} records...`);

            // Clean item codes first for consistent identification
            for (const item of data) {
                item.code = item.code.replace(/-/g, "").trim().toUpperCase();
            }

            // 1. Bulk Process Subjects
            const uniqueSubjectsData = Array.from(new Map(data.map(item => [item.code, item])).values());
            const subjectCodes = uniqueSubjectsData.map(s => s.code);
            
            // Find existing subjects to avoid duplicates
            const existingSubjects = await tx.subject.findMany({
                where: { code: { in: subjectCodes } },
                select: { id: true, code: true }
            });
            const existingCodes = new Set(existingSubjects.map(s => s.code));
            
            const subjectsToCreate = uniqueSubjectsData
                .filter(s => !existingCodes.has(s.code))
                .map(item => {
                    const syllabusInfo = (syllabusCredits as any[]).find(s => 
                        s.code.replace(/-/g, "").toUpperCase() === item.code
                    );
                    return {
                        code: item.code,
                        name: syllabusInfo ? syllabusInfo.name : item.name,
                        credits: syllabusInfo ? syllabusInfo.credits : (item.credits || 4),
                        semester: item.semester
                    };
                });

            if (subjectsToCreate.length > 0) {
                console.log(`[Sync] Batch creating ${subjectsToCreate.length} new subjects...`);
                await tx.subject.createMany({ data: subjectsToCreate, skipDuplicates: true });
            }

            // Map codes to IDs for all subjects
            const allRelevantSubjects = await tx.subject.findMany({
                where: { code: { in: subjectCodes } },
                select: { id: true, code: true }
            });
            const subjectMap = new Map(allRelevantSubjects.map(s => [s.code, s.id]));

            // 2. Bulk Process Academic Records
            // To perform a batch "upsert", we delete existing matching records and createMany new ones.
            const semesters = Array.from(new Set(data.map(item => item.semester)));
            const subjectIds = Array.from(subjectMap.values());

            console.log(`[Sync] Cleaning existing records for sync...`);
            await tx.academicRecord.deleteMany({
                where: {
                    studentId,
                    semester: { in: semesters },
                    subjectId: { in: subjectIds }
                }
            });

            const recordsToCreate = data.map(item => {
                const subjectId = subjectMap.get(item.code)!;
                const letterGrade = this.getLetterGrade(item.marks);
                return {
                    studentId,
                    subjectId,
                    internalMarks: item.internalMarks,
                    externalMarks: item.externalMarks,
                    marks: item.marks,
                    grade: letterGrade,
                    semester: item.semester,
                    maxMarks: 100
                };
            });

            if (recordsToCreate.length > 0) {
                console.log(`[Sync] Batch creating ${recordsToCreate.length} academic records...`);
                await tx.academicRecord.createMany({ data: recordsToCreate });
            }

            console.log(`[Sync] Student CGPA update skipped as requested.`);
        }, {
            timeout: 60000 // 60 seconds timeout
        });

        console.log(`[Sync] Database update complete for ${studentId}.`);
    }
}
