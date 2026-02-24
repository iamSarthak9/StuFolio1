import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Users,
    Search,
    Loader2,
    ChevronRight,
    TrendingUp,
    Filter,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

const statusMap: Record<string, { label: string; className: string }> = {
    ok: { label: "Healthy", className: "bg-accent/10 text-accent border-accent/20" },
    warning: { label: "Warning", className: "bg-warning/10 text-warning border-warning/20" },
    danger: { label: "At Risk", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const MentorStudentsPage = () => {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "danger" | "warning" | "ok">("all");
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                // Fetch students from the mentor's section
                const result = await api.getMentorStudents();
                setStudents(result as any[]);
            } catch (err) {
                console.error("Failed to load students:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = students
        .filter((s: any) => {
            // Determine status based on the same logic as dashboard
            const status = s.attendance < 75 ? "danger" : s.cgpa < 6 ? "warning" : "ok";
            return filter === "all" || status === filter;
        })
        .filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <DashboardLayout title="Student Directory" subtitle="Manage all students in your section" role="mentor">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search students by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-secondary/50 border-border rounded-xl"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground bg-secondary/30 rounded-lg border border-border">
                        <Filter className="h-3.5 w-3.5" />
                        <span>Filter:</span>
                    </div>
                    {(["all", "danger", "warning", "ok"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${filter === f
                                ? f === "danger" ? "bg-destructive/10 text-destructive border-destructive/20"
                                    : f === "warning" ? "bg-warning/10 text-warning border-warning/20"
                                        : f === "ok" ? "bg-accent/10 text-accent border-accent/20"
                                            : "bg-primary/10 text-primary border-primary/20"
                                : "text-muted-foreground border-border hover:bg-secondary/50"
                                }`}
                        >
                            {f === "all" ? "All Students" : f === "danger" ? "At Risk" : f === "warning" ? "Warning" : "Healthy"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredStudents.length > 0 ? (
                    <div className="divide-y divide-border/50">
                        {filteredStudents.map((student: any, i) => {
                            const statusKey = student.attendance < 75 ? "danger" : student.cgpa < 6 ? "warning" : "ok";
                            const status = statusMap[statusKey];
                            return (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                >
                                    <Link
                                        to={`/mentor/student-detail?id=${student.id}`}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 hover:bg-secondary/30 transition-colors gap-3 sm:gap-0"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0">
                                                {student.name.split(" ").map((n: string) => n[0]).join("")}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-foreground truncate">{student.name}</span>
                                                    <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground hidden sm:inline-block shrink-0">{student.enrollment}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                                                    <span className="text-xs text-muted-foreground">Section: {student.section}</span>
                                                    <span className="text-xs text-muted-foreground hidden sm:inline">Semester: {student.semester}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 sm:gap-6 pl-[52px] sm:pl-0">
                                            <div className="flex items-center gap-4 sm:gap-8">
                                                <div className="text-center">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">CGPA</p>
                                                    <p className="text-xs sm:text-sm font-display font-bold text-foreground">{student.cgpa}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Att.</p>
                                                    <p className={`text-xs sm:text-sm font-display font-bold ${student.attendance < 75 ? "text-destructive" : "text-accent"}`}>{student.attendance}%</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${status.className}`}>
                                                    {status.label}
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground">No students found</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                            {search ? `No students matching "${search}" in this category.` : "No students are currently assigned to your section."}
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MentorStudentsPage;
