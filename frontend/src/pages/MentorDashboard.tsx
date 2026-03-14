import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  ChevronRight,
  Search,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const trendData = [
  { month: "Aug", current: 68, past: 72 },
  { month: "Sep", current: 71, past: 70 },
  { month: "Oct", current: 74, past: 71 },
  { month: "Nov", current: 73, past: 73 },
  { month: "Dec", current: 76, past: 72 },
  { month: "Jan", current: 78, past: 74 },
  { month: "Feb", current: 74.6, past: 73 },
];

const statusMap: Record<string, { label: string; className: string }> = {
  ok: { label: "Healthy", className: "bg-accent/10 text-accent border-accent/20" },
  warning: { label: "Warning", className: "bg-warning/10 text-warning border-warning/20" },
  danger: { label: "At Risk", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
};

const MentorDashboard = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "danger" | "warning" | "ok">("all");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.getMentorDashboard();
        setData(result);
      } catch (err) {
        console.error("Failed to load mentor dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Mentor Dashboard" subtitle="Loading..." role="mentor">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = data?.stats || { totalStudents: 0, atRiskCount: 0, averageCGPA: "0", section: "" };
  const students = data?.students || [];
  const cgpaDistribution = data?.cgpaDistribution || [];
  const attendanceDistribution = data?.attendanceDistribution || [];

  const classStats = [
    { label: "Total Students", value: String(stats.totalStudents), icon: Users, accent: "primary", change: "" },
    { label: "Avg CGPA", value: stats.averageCGPA, icon: BarChart3, accent: "accent", change: `Section ${stats.section}` },
    { label: "At Risk", value: String(stats.atRiskCount), icon: AlertTriangle, accent: "destructive", change: "Need attention" },
    { label: "Performing Well", value: String(stats.totalStudents - stats.atRiskCount), icon: TrendingUp, accent: "accent", change: `${stats.totalStudents > 0 ? Math.round(((stats.totalStudents - stats.atRiskCount) / stats.totalStudents) * 100) : 0}% of class` },
  ];

  const filteredStudents = students
    .filter((s: any) => filter === "all" || s.status === filter)
    .filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout title="Mentor Dashboard" subtitle={`Section ${stats.section} — ${user?.name || "Mentor"}`} role="mentor">
      {/* At-risk alert */}
      {stats.atRiskCount > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 rounded-xl p-4 bg-destructive/10 border border-destructive/20 text-destructive mb-6"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{stats.atRiskCount} students need attention!</p>
            <p className="text-xs opacity-80">Students with attendance below 75% or declining performance.</p>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {classStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border bg-card p-5 card-hover"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${stat.accent === "primary" ? "bg-primary/10 text-primary" :
                stat.accent === "accent" ? "bg-accent/10 text-accent" :
                  "bg-destructive/10 text-destructive"
                }`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold text-foreground">{stat.value}</div>
            {stat.change && <div className="text-xs text-muted-foreground mt-1">{stat.change}</div>}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* CGPA Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="font-display font-semibold text-foreground mb-1">CGPA Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Class-wide breakdown</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cgpaDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Attendance Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="font-display font-semibold text-foreground mb-1">Attendance Overview</h3>
          <p className="text-xs text-muted-foreground mb-4">Student attendance distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={attendanceDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                {attendanceDistribution.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {attendanceDistribution.map((d: any) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                <span className="text-[10px] text-muted-foreground">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trend Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="font-display font-semibold text-foreground mb-1">Performance Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Current vs past batch</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="mc1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} domain={[60, 85]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="current" stroke="hsl(var(--primary))" fill="url(#mc1)" strokeWidth={2} name="Current Batch" />
              <Area type="monotone" dataKey="past" stroke="hsl(var(--muted-foreground))" fill="transparent" strokeWidth={2} strokeDasharray="4 4" name="Past Batch" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="h-2 w-6 rounded bg-primary" /><span className="text-[10px] text-muted-foreground">Current</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-6 rounded bg-muted-foreground border-t border-dashed" /><span className="text-[10px] text-muted-foreground">Past</span></div>
          </div>
        </motion.div>
      </div>

      {/* Student List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="rounded-xl border border-border bg-card"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-border gap-3">
          <div>
            <h3 className="font-display font-semibold text-foreground">Student Overview</h3>
            <p className="text-xs text-muted-foreground">Click on a student for detailed view</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["all", "danger", "warning", "ok"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[10px] font-medium px-2.5 py-1 rounded-md border transition-all ${filter === f
                    ? f === "danger" ? "bg-destructive/10 text-destructive border-destructive/20"
                      : f === "warning" ? "bg-warning/10 text-warning border-warning/20"
                        : f === "ok" ? "bg-accent/10 text-accent border-accent/20"
                          : "bg-primary/10 text-primary border-primary/20"
                    : "text-muted-foreground border-border hover:bg-secondary/50"
                    }`}
                >
                  {f === "all" ? "All" : f === "danger" ? "At Risk" : f === "warning" ? "Warning" : "Healthy"}
                </button>
              ))}
            </div>
            <div className="relative w-40">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary/50 border-border rounded-lg"
              />
            </div>
          </div>
        </div>
        <div className="divide-y divide-border/50">
          {filteredStudents.map((student: any) => {
            const status = statusMap[student.status] || statusMap.ok;
            return (
              <Link
                key={student.id || student.name}
                to={`/mentor/student-detail?id=${student.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3.5 hover:bg-secondary/30 transition-colors gap-2 sm:gap-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {student.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{student.name}</span>
                      <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground shrink-0">{student.enrollment}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">CGPA: {student.cgpa}</span>
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">Problems: {student.problems}</span>
                      <span className={`text-[11px] ${student.attendance < 75 ? "text-destructive" : "text-muted-foreground"}`}>
                        Att: {student.attendance}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-12 sm:pl-0">
                  {student.trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-accent" />}
                  {student.trend === "down" && <TrendingUp className="h-3.5 w-3.5 text-destructive rotate-180" />}
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${status.className}`}>
                    {status.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default MentorDashboard;
