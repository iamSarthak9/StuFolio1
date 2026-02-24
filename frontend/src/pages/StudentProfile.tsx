import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Mail,
    Hash,
    MapPin,
    ExternalLink,
    Code,
    Star,
    Flame,
    Trophy,
    GraduationCap,
    Award,
    Target,
    BookOpen,
    Loader2,
    LucideIcon,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import api, { StudentProfileResponse, Profile, CodingProfile } from "@/lib/api";

const iconMap: Record<string, LucideIcon> = {
    Flame, Code, Target, BookOpen, Trophy, GraduationCap, Award, Star,
};

const StudentProfile = () => {
    const [data, setData] = useState<StudentProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api.getStudentProfile();
                setData(result);
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const colorMap: Record<string, { color: string; bg: string }> = {
        LeetCode: { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
        Codeforces: { color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
        GitHub: { color: "text-gray-300", bg: "bg-gray-400/10 border-gray-400/20" },
    };

    if (loading || !data) {
        return (
            <DashboardLayout title="My Profile" subtitle="Loading..." role="student">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    const { profile, semesterCGPAs, codingProfiles, badges, skills } = data;
    const initials = (profile.name || "S").split(" ").map((n: string) => n[0]).join("").toUpperCase();

    // Generate Heatmap Grid (364 days / 52 weeks)
    const generateActivityGrid = (profiles: CodingProfile[]) => {
        const grid: { count: number; date: string }[][] = Array.from({ length: 52 }, () =>
            Array.from({ length: 7 }, () => ({ count: 0, date: "" }))
        );
        const combinedActivity: Record<string, number> = {};

        profiles.forEach((p) => {
            if (p.activityData && typeof p.activityData === 'object') {
                Object.entries(p.activityData).forEach(([date, count]) => {
                    combinedActivity[date] = (combinedActivity[date] || 0) + (count as number);
                });
            }
        });

        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (52 * 7) + 1);

        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);

        for (let wi = 0; wi < 52; wi++) {
            for (let di = 0; di < 7; di++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (wi * 7) + di);
                const dateString = currentDate.toISOString().split('T')[0];
                grid[wi][di] = {
                    count: combinedActivity[dateString] || 0,
                    date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                };
            }
        }
        return grid;
    };

    const activityGrid = generateActivityGrid(codingProfiles);

    return (
        <DashboardLayout title="My Profile" subtitle="Your academic & coding identity" role="student">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card overflow-hidden mb-8"
            >
                <div className="h-32 bg-gradient-to-r from-primary/20 via-purple-500/15 to-accent/10 relative">
                    <div className="absolute inset-0 grid-pattern opacity-20" />
                </div>
                <div className="px-4 sm:px-6 pb-6 -mt-10 sm:-mt-12">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-primary flex items-center justify-center text-xl sm:text-2xl font-extrabold text-white border-4 border-card shadow-glow shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground truncate">{profile.name}</h2>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-1">
                                <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground"><Hash className="h-3 w-3" />{profile.enrollment}</span>
                                <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground"><Mail className="h-3 w-3" />{profile.email}</span>
                                <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{profile.section} · {profile.year}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                            <div className="flex-1 sm:flex-none text-center px-3 sm:px-5 py-2 rounded-xl bg-primary/10 border border-primary/20 sm:min-w-[90px]">
                                <div className="text-lg sm:text-xl font-display font-bold text-primary">{profile.cgpa}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">CGPA</div>
                            </div>
                            {profile.rank && (
                                <div className="flex-1 sm:flex-none text-center px-3 sm:px-5 py-2 rounded-xl bg-warning/10 border border-warning/20 sm:min-w-[90px]">
                                    <div className="text-lg sm:text-xl font-display font-bold text-warning">#{profile.rank}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Rank</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Academic Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <h3 className="font-display font-semibold text-foreground mb-1">Academic Summary</h3>
                    <p className="text-xs text-muted-foreground mb-4">Semester-wise CGPA progression</p>
                    <div className="space-y-3">
                        {semesterCGPAs.map((s) => (
                            <div key={s.sem} className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-14">{s.sem}</span>
                                <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(s.cgpa / 10) * 100}%` }}
                                        transition={{ delay: 0.5, duration: 0.8 }}
                                        className="h-full rounded-full bg-gradient-primary"
                                    />
                                </div>
                                <span className="text-xs font-semibold text-foreground w-8 text-right">{s.cgpa}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Branch</span>
                            <span className="text-foreground font-medium">{profile.branch}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                            <span className="text-muted-foreground">Semester</span>
                            <span className="text-foreground font-medium">{profile.semester}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Coding Profiles */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 space-y-4"
                >
                    {codingProfiles.map((p) => {
                        const colors = colorMap[p.platform] || { color: "text-primary", bg: "bg-primary/10 border-primary/20" };
                        return (
                            <div key={p.platform} className={`rounded-xl border p-5 ${colors.bg}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-display font-bold text-base ${colors.color}`}>{p.platform}</span>
                                        <span className="text-xs text-muted-foreground">{p.handle}</span>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {p.stats?.map((stat) => (
                                        <div key={stat.label} className="bg-white/5 p-2 rounded-lg border border-current/5">
                                            <p className="text-[10px] sm:text-[11px] text-muted-foreground opacity-80">{stat.label}</p>
                                            <p className="text-xs sm:text-sm font-bold text-foreground truncate">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Activity Heatmap */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-8 w-full overflow-hidden"
            >
                <h3 className="font-display font-semibold text-foreground mb-1">Activity Heatmap</h3>
                <p className="text-xs text-muted-foreground mb-4">Your problem-solving activity over the past year</p>
                <div className="relative">
                    <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                        <div className="flex gap-[3px] min-w-[max-content] md:min-w-0 md:justify-between pr-4">
                            {activityGrid.map((week, wi) => (
                                <div key={wi} className="flex flex-col gap-[3px] shrink-0">
                                    {week.map((day, di) => (
                                        <div
                                            key={di}
                                            title={`${day.count} submissions on ${day.date}`}
                                            className={`h-[10px] w-[10px] sm:h-[11px] sm:w-[11px] rounded-[2px] transition-all hover:ring-1 hover:ring-primary/50 cursor-pointer group relative ${day.count === 0 ? "bg-secondary" :
                                                day.count === 1 ? "bg-primary/20" :
                                                    day.count === 2 ? "bg-primary/40" :
                                                        day.count === 3 ? "bg-primary/60" :
                                                            "bg-primary"
                                                }`}
                                        >
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded pointer-events-none opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 transition-opacity">
                                                {day.count} submissions on {day.date}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Visual fade effect to indicate more content on small screens */}
                    <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-card to-transparent pointer-events-none md:hidden" />
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl border border-border bg-card p-4 sm:p-6"
                >
                    <h3 className="font-display font-semibold text-foreground mb-1 text-sm sm:text-base">Badges</h3>
                    <p className="text-xs text-muted-foreground mb-4">Achievements and milestones</p>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                        {badges.map((badge) => (
                            <div
                                key={badge.label}
                                className="flex items-center gap-3 rounded-xl border p-3 transition-all border-primary/30 bg-primary/5 hover:bg-primary/10"
                            >
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/20 text-primary">
                                    <div className="flex items-center justify-center">
                                        {(() => {
                                            const Icon = iconMap[badge.icon] || Award;
                                            return <Icon className="h-5 w-5" />;
                                        })()}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-foreground truncate">{badge.label}</p>
                                    <p className="text-[10px] text-muted-foreground line-clamp-1">{badge.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Skills */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-xl border border-border bg-card p-4 sm:p-6"
                >
                    <h3 className="font-display font-semibold text-foreground mb-1 text-sm sm:text-base">Skills & Technologies</h3>
                    <p className="text-xs text-muted-foreground mb-4">Technologies you've worked with</p>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill: string) => (
                            <span
                                key={skill}
                                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-border bg-secondary/50 text-xs font-medium text-foreground hover:border-primary/30 transition-all cursor-default"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default StudentProfile;
