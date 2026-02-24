import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Save,
    Loader2,
    GraduationCap,
    Search,
    BookOpen,
    Edit3,
    CheckCircle2
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const MentorAcademicRecordsPage = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [marks, setMarks] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsData, subjectsData] = await Promise.all([
                    api.getMentorStudents(),
                    api.getMentorSubjects()
                ]);
                setStudents(studentsData as any[]);
                setSubjects(subjectsData as any[]);
            } catch (err) {
                console.error("Failed to load data:", err);
                toast.error("Failed to load records");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleEditStudent = (student: any) => {
        setSelectedStudent(student);
        // Reset marks for editing
        setMarks({});
    };

    const handleSaveMarks = async (subjectId: string) => {
        if (!selectedStudent || marks[subjectId] === undefined) return;

        setSubmitting(true);
        try {
            await api.updateStudentAcademics(selectedStudent.id, {
                subjectId,
                marks: marks[subjectId],
                semester: selectedStudent.semester
            });
            toast.success("Marks updated successfully");

            // Refresh student data to see new CGPA
            const updatedStudents = await api.getMentorStudents();
            setStudents(updatedStudents as any[]);
        } catch (err) {
            console.error("Update error:", err);
            toast.error("Failed to update marks");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.enrollment.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <DashboardLayout title="Academic Records" role="mentor">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Academic Records"
            subtitle="Update student marks and performance"
            role="mentor"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Student List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Find student..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-11"
                        />
                    </div>

                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm max-h-[calc(100vh-250px)] overflow-y-auto">
                        <div className="p-3 space-y-1">
                            {filteredStudents.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => handleEditStudent(s)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${selectedStudent?.id === s.id
                                        ? "bg-primary/10 text-primary border border-primary/20"
                                        : "hover:bg-secondary/80 text-foreground border border-transparent"
                                        }`}
                                >
                                    <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                        {s.name.split(' ').map((n: string) => n[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm truncate">{s.name}</div>
                                        <div className="text-[10px] text-muted-foreground truncate">{s.enrollment}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs font-bold text-accent">GPA {s.cgpa}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Marks Entry */}
                <div className="lg:col-span-2">
                    {selectedStudent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-card border border-border rounded-xl p-6 shadow-sm"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-xl font-bold text-white shrink-0">
                                        {selectedStudent.name[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-display font-bold text-foreground truncate">{selectedStudent.name}</h2>
                                        <p className="text-sm text-muted-foreground">Semester {selectedStudent.semester} • {selectedStudent.section}</p>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right pl-[72px] sm:pl-0">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current CGPA</p>
                                    <div className="text-3xl font-display font-black text-gradient-primary">{selectedStudent.cgpa}</div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    Subject-wise Marks
                                </h3>

                                <div className="grid gap-4">
                                    {subjects.map((sub) => (
                                        <div key={sub.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/20 group hover:border-primary/30 transition-all">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-muted-foreground mb-1">{sub.code}</div>
                                                <div className="font-semibold text-sm text-foreground truncate">{sub.name}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        placeholder="Marks"
                                                        max={100}
                                                        min={0}
                                                        value={marks[sub.id] ?? ""}
                                                        onChange={(e) => setMarks(prev => ({ ...prev, [sub.id]: Number(e.target.value) }))}
                                                        className="w-24 h-10 text-center font-bold"
                                                    />
                                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">/ 100</span>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    className="h-10 w-10 rounded-lg shadow-sm"
                                                    onClick={() => handleSaveMarks(sub.id)}
                                                    disabled={marks[sub.id] === undefined || submitting}
                                                >
                                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="bg-card border border-dashed border-border rounded-xl h-[400px] flex flex-col items-center justify-center text-center p-8">
                            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                                <GraduationCap className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-display font-bold text-foreground">No Student Selected</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mt-2">Select a student from the left panel to update their academic records and calculate CGPA.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MentorAcademicRecordsPage;
