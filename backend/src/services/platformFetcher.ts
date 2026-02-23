/**
 * Platform API Fetcher — verifies handles and fetches real stats
 * from LeetCode, Codeforces, GitHub, and CodeChef
 */

interface PlatformStats {
    verified: boolean;
    bio?: string;
    stats: { label: string; value: string }[];
    activity?: Record<string, number>; // "YYYY-MM-DD" -> count
}

// ─── LeetCode (GraphQL API) ────────────────────────────

async function fetchLeetCode(handle: string): Promise<PlatformStats> {
    const username = handle.replace(/^@/, "");

    const query = `
        query getUserProfile($username: String!) {
            matchedUser(username: $username) {
                username
                submitStatsGlobal {
                    acSubmissionNum {
                        difficulty
                        count
                    }
                }
                profile {
                    ranking
                    aboutMe
                }
                userCalendar {
                    submissionCalendar
                }
            }
            userContestRanking(username: $username) {
                rating
                attendedContestsCount
            }
        }
    `;

    try {
        const res = await fetch("https://leetcode.com/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables: { username } }),
        });

        if (!res.ok) throw new Error("LeetCode API error");

        const data = (await res.json()) as any;
        const user = data?.data?.matchedUser;

        if (!user) {
            return { verified: false, stats: [] };
        }

        const submissions = user.submitStatsGlobal?.acSubmissionNum || [];
        const totalSolved = submissions.find((s: any) => s.difficulty === "All")?.count || 0;
        const easy = submissions.find((s: any) => s.difficulty === "Easy")?.count || 0;
        const medium = submissions.find((s: any) => s.difficulty === "Medium")?.count || 0;
        const hard = submissions.find((s: any) => s.difficulty === "Hard")?.count || 0;

        const contest = data?.data?.userContestRanking;
        const rating = contest?.rating ? Math.round(contest.rating) : null;
        const contests = contest?.attendedContestsCount || 0;

        const ranking = user.profile?.ranking || null;
        const aboutMe = user.profile?.aboutMe || "";

        // Process LeetCode activity (submissionCalendar is a JSON string of { "unix_timestamp": count })
        const activity: Record<string, number> = {};
        try {
            const cal = JSON.parse(user.userCalendar?.submissionCalendar || "{}");
            Object.entries(cal).forEach(([ts, count]) => {
                const date = new Date(parseInt(ts) * 1000).toISOString().split("T")[0];
                activity[date] = (activity[date] || 0) + (count as number);
            });
        } catch (e) {
            console.error("LeetCode calendar parse error:", e);
        }

        const stats: { label: string; value: string }[] = [
            { label: "Problems Solved", value: String(totalSolved) },
            { label: "Easy / Med / Hard", value: `${easy} / ${medium} / ${hard}` },
        ];

        if (rating) stats.push({ label: "Contest Rating", value: String(rating) });
        if (contests) stats.push({ label: "Contests", value: String(contests) });
        if (ranking) stats.push({ label: "Global Rank", value: `#${ranking.toLocaleString()}` });

        console.log(`[Fetcher] LeetCode activity count: ${Object.keys(activity).length}`);
        return { verified: true, bio: aboutMe, stats, activity };
    } catch (err) {
        console.error("LeetCode fetch error:", err);
        return { verified: false, stats: [] };
    }
}

// ─── Codeforces (REST API) ─────────────────────────────

async function fetchCodeforces(handle: string): Promise<PlatformStats> {
    const username = handle.replace(/^@/, "");

    try {
        const res = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);

        if (!res.ok) throw new Error("Codeforces API error");

        const data = (await res.json()) as any;
        if (data.status !== "OK" || !data.result?.length) {
            return { verified: false, stats: [] };
        }

        const user = data.result[0];

        const rankName = user.rank || "Unrated";
        const rating = user.rating || 0;
        const maxRating = user.maxRating || 0;
        const bio = user.firstName || "";

        let problemsSolved = 0;
        const activity: Record<string, number> = {};

        try {
            const subRes = await fetch(`https://codeforces.com/api/user.status?handle=${username}`);
            if (subRes.ok) {
                const subData = (await subRes.json()) as any;
                if (subData.status === "OK") {
                    const solved = new Set<string>();
                    for (const sub of subData.result) {
                        const date = new Date(sub.creationTimeSeconds * 1000).toISOString().split("T")[0];
                        if (sub.verdict === "OK" && sub.problem) {
                            solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
                            activity[date] = (activity[date] || 0) + 1;
                        }
                    }
                    problemsSolved = solved.size;
                }
            }
        } catch {
            // Optional fetch
        }

        const stats: { label: string; value: string }[] = [
            { label: "Problems Solved", value: String(problemsSolved) },
            { label: "Rating", value: `${rating} (${rankName})` },
            { label: "Max Rating", value: String(maxRating) },
        ];

        if (user.contribution !== undefined) {
            stats.push({ label: "Contribution", value: String(user.contribution) });
        }

        console.log(`[Fetcher] Codeforces activity count: ${Object.keys(activity).length}`);
        return { verified: true, bio, stats, activity };
    } catch (err) {
        console.error("Codeforces fetch error:", err);
        return { verified: false, stats: [] };
    }
}

// ─── GitHub (REST API) ─────────────────────────────────

async function fetchGitHub(handle: string): Promise<PlatformStats> {
    const username = handle.replace(/^@/, "");

    try {
        const res = await fetch(`https://api.github.com/users/${username}`, {
            headers: { "Accept": "application/vnd.github.v3+json" },
        });

        if (res.status === 404) {
            return { verified: false, stats: [] };
        }
        if (!res.ok) throw new Error("GitHub API error");

        const user = (await res.json()) as any;
        const bio = user.bio || "";

        const stats: { label: string; value: string }[] = [
            { label: "Public Repos", value: String(user.public_repos || 0) },
            { label: "Followers", value: String(user.followers || 0) },
            { label: "Following", value: String(user.following || 0) },
        ];

        if (user.bio) stats.push({ label: "Bio", value: user.bio.substring(0, 50) });

        return { verified: true, bio, stats };
    } catch (err) {
        console.error("GitHub fetch error:", err);
        return { verified: false, stats: [] };
    }
}

// ─── CodeChef (basic check) ────────────────────────────

async function fetchCodeChef(handle: string): Promise<PlatformStats> {
    const username = handle.replace(/^@/, "");

    // CodeChef doesn't have a straightforward public API
    // We'll do a basic profile page check and try to extract the Name
    try {
        const res = await fetch(`https://www.codechef.com/users/${username}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            redirect: "follow",
        });

        if (!res.ok || res.url.includes("/error")) {
            return { verified: false, stats: [] };
        }

        const html = await res.text();
        // The name is usually inside an h1 tag
        const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
        const bio = nameMatch ? nameMatch[1].trim() : "";

        return {
            verified: true,
            bio,
            stats: [
                { label: "Username", value: username },
                { label: "Platform", value: "CodeChef" },
            ],
        };
    } catch (err) {
        console.error("CodeChef fetch error:", err);
        return {
            verified: false,
            stats: [],
        };
    }
}

// ─── Main Export ───────────────────────────────────────

export async function fetchPlatformStats(platform: string, handle: string): Promise<PlatformStats> {
    switch (platform) {
        case "LeetCode":
            return fetchLeetCode(handle);
        case "Codeforces":
            return fetchCodeforces(handle);
        case "GitHub":
            return fetchGitHub(handle);
        case "CodeChef":
            return fetchCodeChef(handle);
        default:
            return { verified: false, stats: [] };
    }
}
