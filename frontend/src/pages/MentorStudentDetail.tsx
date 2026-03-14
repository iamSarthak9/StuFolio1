import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    User,
    Mail,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    ArrowLeft,
    Code,
    GraduationCap,
    Calendar,
    Sparkles,
    ExternalLink,
    Flame,
    Loader2,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from "recharts";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import EmailAlertModal from "@/components/EmailAlertModal";
import api from "@/lib/api";

const tooltipStyle = {
    background: "#ffffff",
    border: "1px solid hsl(220, 13%, 91%)",
    borderRadius: "8px",
    color: "hsl(220, 14%, 10%)",
};

const MentorStudentDetail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const studentId = searchParams.get("id");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

    useEffect(() => {
        const fetchStudentData = async () => {
            if (!studentId) {
                navigate("/mentor/students");
                return;
            }
            try {
                const result = await api.getMentorStudentDetail(studentId);
                setData(result);
            } catch (err) {
                console.error("Failed to fetch student details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudentData();
    }, [studentId]);

    if (loading) {
        return (
            <DashboardLayout title="Student Detail" subtitle="Loading..." role="mentor">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!data) {
        return (
            <DashboardLayout title="Student Detail" subtitle="Not Found" role="mentor">
                <div className="py-20 text-center">
                    <p className="text-muted-foreground">Student not found.</p>
                    <Link to="/mentor" className="text-primary hover:underline mt-4 inline-block">Back to Dashboard</Link>
                </div>
            </DashboardLayout>
        );
    }

    const { profile, semesterCGPAs, attendance, codingProfiles, academicRecords } = data;

    // Map Semester CGPAs to Performance Trend Chart
    const performanceData = semesterCGPAs.map((s: any) => ({
        week: s.sem.replace(" Semester", ""),
        score: s.cgpa * 10 // Convert to 100-scale for chart
    }));

    // Map Academic Records to competency chart (top 6 subjects)
    const subjectData = academicRecords.slice(0, 6).map((r: any) => ({
        subject: r.code,
        score: r.marks,
        fullMark: 100
    }));

    const totalProblems = codingProfiles.reduce((sum: number, cp: any) => {
        const solved = cp.stats.find((s: any) => s.label.toLowerCase().includes("solved"));
        return sum + (solved ? parseInt(solved.value.replace(/,/g, "")) || 0 : 0);
    }, 0);

    const overallAttendance = attendance.length > 0
        ? (attendance.reduce((sum: number, a: any) => sum + a.percentage, 0) / attendance.length).toFixed(1)
        : "0";

    const aiInsights = [
        `${profile.name}'s current CGPA is ${profile.cgpa}. ${profile.cgpa < 7.5 ? "Focus on core subjects to improve overall ranking." : "Excellent academic standing."}`,
        `Attendance average is ${overallAttendance}%. ${Number(overallAttendance) < 75 ? "Warning: Below eligibility threshold in multiple subjects." : "Consistency in attendance is being maintained."}`,
        `Actively practicing on ${codingProfiles.length} platforms. Total problems solved: ${totalProblems}.`,
    ];

    return (
        <DashboardLayout title="Student Detail" subtitle={`Detailed view — ${profile.name}`} role="mentor">
            <div className="flex items-center justify-between mb-6">
                {/* Back button */}
                <Link to="/mentor" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <button
                    onClick={() => setIsAlertModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 px-4 py-2 rounded-xl transition-colors"
                >
                    <Mail className="h-4 w-4" />
                    Send Alert
                </button>
            </div>

            {/* Profile header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-6 mb-8"
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-xl font-bold text-white shadow-glow shrink-0">
                        {profile.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-display font-bold text-foreground truncate">{profile.name}</h2>
                        <div className="flex flex-wrap gap-3 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1 truncate"><Mail className="h-3 w-3 shrink-0" />{profile.email}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><GraduationCap className="h-3 w-3 shrink-0" />{profile.enrollment} · {profile.section}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                        <div className="text-center px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 flex-1 sm:flex-none min-w-[80px]">
                            <div className="text-lg font-display font-bold text-primary">{profile.cgpa}</div>
                            <div className="text-[10px] text-muted-foreground">CGPA</div>
                        </div>
                        <div className={`text-center px-4 py-2 rounded-xl flex-1 sm:flex-none min-w-[80px] ${Number(overallAttendance) < 75 ? "bg-destructive/10 border border-destructive/20" : "bg-accent/10 border border-accent/20"}`}>
                            <div className={`text-lg font-display font-bold ${Number(overallAttendance) < 75 ? "text-destructive" : "text-accent"}`}>{overallAttendance}%</div>
                            <div className="text-[10px] text-muted-foreground">Attendance</div>
                        </div>
                        <div className="text-center px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 flex-1 sm:flex-none min-w-[80px]">
                            <div className="text-lg font-display font-bold text-amber-400">{totalProblems}</div>
                            <div className="text-[10px] text-muted-foreground">Problems</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* AI Insights for Mentor */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-purple-500/5 to-transparent p-5 mb-8"
            >
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-display font-semibold text-foreground text-sm">AI Insights for {profile.name}</h3>
                </div>
                <ul className="space-y-2">
                    {aiInsights.map((insight, i) => (
                        <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                            <span className="text-primary shrink-0">•</span>
                            {insight}
                        </li>
                    ))}
                </ul>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Performance Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <h3 className="font-display font-semibold text-foreground mb-1">Performance Trend</h3>
                    <p className="text-xs text-muted-foreground mb-4">Semester CGPA progression</p>
                    {performanceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="msd1" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(234, 89%, 56%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(234, 89%, 56%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                                <XAxis dataKey="week" tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 11 }} axisLine={false} />
                                <YAxis tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 11 }} axisLine={false} domain={[0, 100]} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Area type="monotone" dataKey="score" stroke="hsl(234, 89%, 56%)" fill="url(#msd1)" strokeWidth={2} name="Score" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No semester records available</div>
                    )}
                </motion.div>

                {/* Subject Radar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <h3 className="font-display font-semibold text-foreground mb-1">Subject Competency</h3>
                    <p className="text-xs text-muted-foreground mb-4">Performance across subjects</p>
                    {subjectData.length >= 3 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <RadarChart data={subjectData}>
                                <PolarGrid stroke="hsl(220, 13%, 91%)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 11 }} />
                                <PolarRadiusAxis tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 10 }} domain={[0, 100]} />
                                <Radar dataKey="score" stroke="hsl(0, 72%, 51%)" fill="hsl(0, 72%, 51%)" fillOpacity={0.15} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Need at least 3 subjects for analysis</div>
                    )}
                </motion.div>
            </div>

            {/* Attendance by Subject */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-xl border border-border bg-card p-6"
            >
                <h3 className="font-display font-semibold text-foreground mb-1">Attendance Breakdown</h3>
                <p className="text-xs text-muted-foreground mb-4">Subject-wise attendance status</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attendance.map((s: any) => {
                        const percent = s.percentage;
                        const isBad = percent < 75;
                        return (
                            <div key={s.code} className={`rounded-xl border p-4 ${isBad ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-foreground">{s.subject}</span>
                                    {isBad ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-accent" />}
                                </div>
                                <div className="h-2 rounded-full bg-secondary overflow-hidden mb-2">
                                    <div className={`h-full rounded-full ${isBad ? "bg-destructive" : "bg-accent"}`} style={{ width: `${percent}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground">{s.attended}/{s.total} classes · <span className={isBad ? "text-destructive" : "text-accent"}>{percent}%</span></p>
                            </div>
                        );
                    })}
                    {attendance.length === 0 && (
                        <div className="col-span-full py-10 text-center text-muted-foreground text-sm">No attendance records found</div>
                    )}
                </div>
            </motion.div>

            {data && (
                <EmailAlertModal
                    isOpen={isAlertModalOpen}
                    onClose={() => setIsAlertModalOpen(false)}
                    studentId={studentId!}
                    studentName={profile.name}
                />
            )}
        </DashboardLayout>
    );
};

export default MentorStudentDetail;
