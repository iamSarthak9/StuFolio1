import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Code,
  GraduationCap,
  Flame,
  Target,
  Award,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Sparkles,
  Loader2,
  Trophy,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const iconMap: Record<string, any> = {
  TrendingUp, Code, GraduationCap, Flame, Target, Award, BookOpen, CheckCircle, Trophy,
};

const performanceDataFallback = [
  { week: "W1", coding: 45, academic: 72 },
  { week: "W2", coding: 52, academic: 70 },
  { week: "W3", coding: 61, academic: 75 },
  { week: "W4", coding: 58, academic: 78 },
  { week: "W5", coding: 72, academic: 80 },
  { week: "W6", coding: 80, academic: 82 },
  { week: "W7", coding: 85, academic: 79 },
  { week: "W8", coding: 90, academic: 85 },
];

const subjectDataFallback = [
  { subject: "DSA", score: 88 },
  { subject: "OS", score: 72 },
  { subject: "DBMS", score: 91 },
  { subject: "CN", score: 65 },
  { subject: "OOP", score: 85 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

const tooltipStyle = {
  background: "hsl(0 0% 100%)",
  border: "1px solid hsl(37 16% 83%)",
  borderRadius: "10px",
  color: "hsl(0 0% 17%)",
  boxShadow: "0 4px 12px hsl(30 10% 15% / 0.1)",
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboard, eventsData] = await Promise.all([
          api.getStudentDashboard(),
          api.getEvents().catch(() => []),
        ]);
        setData(dashboard);
        setEvents(eventsData.slice(0, 3));
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const userName = data?.profile?.name || user?.name || "Student";

  // ── Derive real stats from coding profiles ──────────────────────────────
  const codingProfiles = data?.codingProfiles || [];

  /** Sum all "solved / total solved / problems solved" stats across every platform */
  const totalProblemsSolved = (() => {
    const SOLVE_LABELS = ["solved", "problems solved", "total solved", "total problems", "questions solved"];
    let total = 0;
    codingProfiles.forEach((p: any) => {
      (p.stats || []).forEach((s: any) => {
        if (SOLVE_LABELS.some((kw) => s.label?.toLowerCase().includes(kw))) {
          const n = parseInt(String(s.value).replace(/[^0-9]/g, ""), 10);
          if (!isNaN(n)) total += n;
        }
      });
    });
    return total > 0 ? total : null;
  })();

  /** Compute current streak from combined activityData (same data the heatmap uses) */
  const currentStreak = (() => {
    const combined: Record<string, number> = {};
    codingProfiles.forEach((p: any) => {
      if (p.activityData && typeof p.activityData === "object") {
        Object.entries(p.activityData).forEach(([date, count]) => {
          combined[date] = (combined[date] || 0) + (count as number);
        });
      }
    });
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    };
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    // Accept streak if today has no activity yet (count yesterday as "start")
    let cursor = new Date(today);
    if (!combined[fmt(cursor)]) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (combined[fmt(cursor)] > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak > 0 ? streak : null;
  })();

  // ── Stat cards (API data wins; patch Problems Solved & Day Streak with real numbers) ──
  const statCards = (() => {
    const base = data?.statCards
      ? data.statCards.map((s: any) => ({ ...s, icon: iconMap[s.icon] || TrendingUp }))
      : [
          { label: "Performance Index", value: "—", change: "Loading...", icon: TrendingUp, accent: "primary" },
          { label: "Current CGPA",      value: "—", change: "Loading...", icon: GraduationCap, accent: "accent" },
          { label: "Problems Solved",   value: "—", change: "Loading...", icon: Code,         accent: "chart-3" },
          { label: "Day Streak",        value: "—", change: "Loading...", icon: Flame,         accent: "warning" },
        ];

    return base.map((s: any) => {
      if (s.label === "Problems Solved" && totalProblemsSolved !== null)
        return { ...s, value: totalProblemsSolved.toLocaleString(), change: `Across ${codingProfiles.length} platform${codingProfiles.length !== 1 ? "s" : ""}` };
      if (s.label === "Day Streak" && currentStreak !== null)
        return { ...s, value: `${currentStreak}d`, change: currentStreak >= 7 ? "🔥 Keep it going!" : "From heatmap activity" };
      return s;
    });
  })();

  const warnings = data?.warnings || [];
  const badges = data?.badges
    ? data.badges.map((b: any) => ({
      ...b,
      icon: iconMap[b.icon] || Award,
      earned: true,
    }))
    : [];


  const performanceData = data?.performanceTrend?.length
    ? data.performanceTrend.map((d: any, i: number) => ({
      week: d.semester || `S${i + 1}`,
      cgpa: d.cgpa,
    }))
    : null;

  const upcomingEvents = events.length
    ? events.map((e: any) => ({
      title: e.title,
      date: new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      type: e.type,
      color: e.type === "contest" ? "bg-amber-400/10 text-amber-400" :
        e.type === "deadline" ? "bg-destructive/10 text-destructive" :
          "bg-primary/10 text-primary",
    }))
    : [
      { title: "No upcoming events", date: "", type: "info", color: "bg-secondary/50 text-muted-foreground" },
    ];

  // Generate Heatmap Grid (364 days / 52 weeks)
  const generateActivityGrid = (profiles: any[]) => {
    const grid: { count: number; date: string }[][] = Array.from({ length: 53 }, () =>
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
    today.setHours(12, 0, 0, 0);
    const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
    
    // Start of the grid (Sunday, 52 weeks ago)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek - (52 * 7));

    for (let wi = 0; wi < 53; wi++) {
      for (let di = 0; di < 7; di++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (wi * 7) + di);
        
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        const dateString = `${y}-${m}-${d}`;

        grid[wi][di] = {
          count: combinedActivity[dateString] || 0,
          date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      }
    }
    return grid;
  };

  const activityGrid = generateActivityGrid(codingProfiles);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading..." role="student">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" subtitle={`Welcome back, ${userName.split(" ")[0]} 👋`} role="student">
      {/* Warning Alerts */}
      {warnings.length > 0 && (
        <div className="space-y-2 mb-6">
          {warnings.map((w: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 rounded-xl p-3.5 text-sm ${w.type === "danger"
                ? "bg-destructive/10 border border-destructive/20 text-destructive"
                : "bg-warning/10 border border-warning/20 text-warning"
                }`}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{w.text}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat: any, i: number) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className={`rounded-xl border border-border p-5 text-card-foreground shadow-sm bg-card card-hover ${
              i === 1 || i === 3 ? "tech-card" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${stat.accent === "primary" ? "bg-primary/10 text-primary" :
                stat.accent === "accent" ? "bg-accent/10 text-accent" :
                  stat.accent === "chart-3" ? "bg-orange-500/10 text-orange-400" :
                    "bg-warning/10 text-warning"
                }`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.change}</div>
          </motion.div>
        ))}
      </div>

      {/* AI Insight Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 mb-8"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-glow shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground text-sm mb-1">AI Insight</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {warnings.length > 0
                ? `Focus areas detected: ${warnings.map((w: any) => w.text.split(" ")[0]).join(", ")}. Keep building your coding streak and attend upcoming classes to strengthen eligibility.`
                : "Your coding performance is trending upward 📈. Keep up the great work!"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Activity Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="rounded-xl border border-border bg-card p-4 sm:p-5 mb-8 w-full overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-foreground text-sm mb-0.5">Activity Heatmap</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Problem-solving activity across all platforms</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-[2px]">
              <div className="h-2 w-2 rounded-[1px] bg-secondary" />
              <div className="h-2 w-2 rounded-[1px] bg-primary/20" />
              <div className="h-2 w-2 rounded-[1px] bg-primary/40" />
              <div className="h-2 w-2 rounded-[1px] bg-primary/60" />
              <div className="h-2 w-2 rounded-[1px] bg-primary" />
            </div>
            <span>More</span>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-[2px] sm:gap-[3px] mx-auto" style={{ width: 'max-content' }}>
              {activityGrid.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px] sm:gap-[3px]">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={`h-[8px] w-[8px] sm:h-[10px] sm:w-[10px] rounded-[1.5px] transition-all hover:ring-1 hover:ring-primary/50 cursor-pointer group relative ${day.count === 0 ? "bg-secondary/60" :
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
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-6"
        >
          <h3 className="font-display font-semibold text-foreground mb-1">Growth Trend</h3>
          <p className="text-xs text-muted-foreground mb-6">
            {performanceData ? "CGPA progression across semesters" : "Coding vs Academic performance over 8 weeks"}
          </p>
          <ResponsiveContainer width="100%" height={280}>
            {performanceData ? (
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorCgpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(24.6 95% 53.1%)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(24.6 95% 53.1%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} domain={[6, 10]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="cgpa" stroke="hsl(24.6 95% 53.1%)" fill="url(#colorCgpa)" strokeWidth={2} name="CGPA" />
              </AreaChart>
            ) : (
              <AreaChart data={performanceDataFallback}>
                <defs>
                  <linearGradient id="colorCoding" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(24.6 95% 53.1%)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(24.6 95% 53.1%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAcademic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(200 70% 50%)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(200 70% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="coding" stroke="hsl(24.6 95% 53.1%)" fill="url(#colorCoding)" strokeWidth={2} name="Coding" />
                <Area type="monotone" dataKey="academic" stroke="hsl(200 70% 50%)" fill="url(#colorAcademic)" strokeWidth={2} name="Academic" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </motion.div>

        {/* Subject Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="font-display font-semibold text-foreground mb-1">Subject Scores</h3>
          <p className="text-xs text-muted-foreground mb-6">Internal assessment breakdown</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={subjectDataFallback} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(37 16% 83%)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "hsl(30 6% 45%)", fontSize: 12 }} axisLine={false} domain={[0, 100]} />
              <YAxis type="category" dataKey="subject" tick={{ fill: "hsl(30 6% 45%)", fontSize: 12 }} axisLine={false} width={50} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="score" fill="hsl(16 64% 54%)" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Coding Profiles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-6"
        >
          <h3 className="font-display font-semibold text-foreground mb-1">Coding Profiles</h3>
          <p className="text-xs text-muted-foreground mb-4">Your linked competitive programming accounts</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {codingProfiles.map((p: any) => {
              const colorMap: Record<string, { text: string; bg: string }> = {
                LeetCode: { text: "text-amber-400", bg: "bg-amber-400/10" },
                Codeforces: { text: "text-blue-400", bg: "bg-blue-400/10" },
                GitHub: { text: "text-gray-300", bg: "bg-gray-400/10" },
              };
              const colors = colorMap[p.platform] || { text: "text-primary", bg: "bg-primary/10" };
              return (
                <div key={p.platform} className={`rounded-xl border border-border p-4 ${colors.bg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-display font-semibold text-sm ${colors.text}`}>{p.platform}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{p.handle}</p>
                  <div className="space-y-1">
                    {p.stats?.map((stat: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{stat.label}</span>
                        <span className="text-foreground font-medium">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-foreground mb-0.5">Upcoming</h3>
              <p className="text-xs text-muted-foreground">Events & deadlines</p>
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {upcomingEvents.map((event: any) => {
              const Content = (
                <div key={event.title} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                  <div className={`h-2 w-2 rounded-full ${event.color.replace('text-', 'bg-').split(' ')[0]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.date}</p>
                  </div>
                </div>
              );

              return event.link ? (
                <a href={event.link} target="_blank" rel="noopener noreferrer" key={event.id || event.title}>
                  {Content}
                </a>
              ) : Content;
            })}
          </div>
        </motion.div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="font-display font-semibold text-foreground mb-1">Achievements</h3>
          <p className="text-xs text-muted-foreground mb-6">Your earned badges and milestones</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {badges.map((badge: any) => (
              <div
                key={badge.label}
                className="flex flex-col items-center gap-2.5 rounded-xl border p-4 transition-all border-primary/30 bg-primary/5 card-hover"
              >
                <div className="h-11 w-11 rounded-full flex items-center justify-center bg-primary/20 text-primary">
                  <badge.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-center text-foreground">{badge.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;
