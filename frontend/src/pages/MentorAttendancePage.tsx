import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    X,
    Save,
    Calendar as CalendarIcon,
    Search,
    Loader2,
    CheckCircle2,
    Minus,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Student {
    id: string;
    name: string;
    enrollment: string;
}

interface Subject {
    id: string;
    name: string;
    code: string;
    semester: string;
}

interface AttendanceRecord {
    studentId: string;
    subjectId: string;
    status: string; // PRESENT | ABSENT | NO_CLASS
}

const MentorAttendancePage = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<string, string>>>({});
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    useEffect(() => {
        fetchSheetData();
    }, [dateStr]);

    const fetchSheetData = async () => {
        setLoading(true);
        try {
            const result = await api.getAttendanceForDay(dateStr);
            setStudents(result.students);
            setSubjects(result.subjects);

            // Build the map: [studentId][subjectId] = status
            const map: Record<string, Record<string, string>> = {};

            // Initialize with NO_CLASS for everything
            result.students.forEach(s => {
                map[s.id] = {};
                result.subjects.forEach(sub => {
                    map[s.id][sub.id] = "NO_CLASS";
                });
            });

            // Fill with existing records
            result.records.forEach(rec => {
                if (map[rec.studentId]) {
                    map[rec.studentId][rec.subjectId] = rec.status;
                }
            });

            setAttendanceMap(map);
        } catch (err) {
            console.error("Failed to load sheet data:", err);
            toast.error("Failed to load attendance sheet");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId: string, subjectId: string, status: string) => {
        setAttendanceMap(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [subjectId]: status
            }
        }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Flatten the map back to list of records
            const flattenedRecords: AttendanceRecord[] = [];
            Object.entries(attendanceMap).forEach(([studentId, subjectRecords]) => {
                Object.entries(subjectRecords).forEach(([subjectId, status]) => {
                    flattenedRecords.push({ studentId, subjectId, status });
                });
            });

            await api.submitAttendanceForDay(dateStr, flattenedRecords);
            toast.success("Attendance sheet saved successfully");
            fetchSheetData(); // Refresh to ensure sync
        } catch (err) {
            console.error("Submission error:", err);
            toast.error("Failed to save attendance");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.enrollment.includes(search)
    );

    if (loading && students.length === 0) {
        return (
            <DashboardLayout title="Attendance Sheet" role="mentor">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Attendance Sheet"
            subtitle="Manage all subjects in a single grid view"
            role="mentor"
        >
            <div className="space-y-6">
                {/* Controls */}
                <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm backdrop-blur-xl bg-opacity-50">
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="w-full md:w-64">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2 px-1">Selected Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full h-11 justify-start text-left font-medium rounded-xl border-border px-3 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all duration-200",
                                            !selectedDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => date && setSelectedDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="w-full md:flex-1">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2 px-1">Search Students</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or enrollment..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-11 rounded-xl bg-background border-border pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid Sheet */}
                <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-secondary/30 backdrop-blur-sm">
                                    <th className="sticky left-0 z-10 bg-secondary/30 px-6 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-left min-w-[200px] border-b border-border">Student Name</th>
                                    {subjects.map(subject => (
                                        <th key={subject.id} className="px-4 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center min-w-[150px] border-b border-border">
                                            <div className="flex flex-col gap-1">
                                                <span>{subject.code}</span>
                                                <span className="text-[9px] font-medium opacity-60 truncate max-w-[140px]">{subject.name}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-secondary/5 transition-colors group">
                                        <td className="sticky left-0 z-10 bg-card group-hover:bg-secondary/5 px-6 py-4 border-r border-border/30">
                                            <div>
                                                <div className="font-semibold text-foreground text-sm">{student.name}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono">{student.enrollment}</div>
                                            </div>
                                        </td>
                                        {subjects.map(subject => {
                                            const status = attendanceMap[student.id]?.[subject.id] || "NO_CLASS";
                                            return (
                                                <td key={subject.id} className="px-2 py-4 text-center">
                                                    <select
                                                        value={status}
                                                        onChange={(e) => handleStatusChange(student.id, subject.id, e.target.value)}
                                                        className={`w-full max-w-[120px] h-9 rounded-lg border-2 text-[11px] font-bold px-2 focus:outline-none transition-all cursor-pointer shadow-sm ${status === "PRESENT"
                                                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400" 
                                                            : status === "ABSENT"
                                                                ? "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400"
                                                                : "bg-secondary border-border text-foreground hover:bg-secondary/80"
                                                            }`}
                                                    >
                                                        <option value="PRESENT" className="bg-white dark:bg-slate-900 text-black dark:text-white">Present</option>
                                                        <option value="ABSENT" className="bg-white dark:bg-slate-900 text-black dark:text-white">Absent</option>
                                                        <option value="NO_CLASS" className="bg-white dark:bg-slate-900 text-black dark:text-white">No Class</option>
                                                    </select>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Legend & Summary */}
                <div className="flex flex-wrap items-center justify-between gap-6 px-2">
                    <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-md bg-emerald-500/10 border-2 border-emerald-500"></div> Present
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-md bg-red-500/10 border-2 border-red-500"></div> Absent
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-md bg-secondary border-2 border-border"></div> No Class
                        </div>
                    </div>

                    <Button
                        disabled={submitting || loading}
                        onClick={handleSubmit}
                        className="rounded-xl h-12 px-10 font-bold shadow-glow flex items-center gap-2 text-sm"
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save All Changes
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MentorAttendancePage;
