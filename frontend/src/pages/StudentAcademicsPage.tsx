import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    RefreshCw,
    BookOpen,
    TrendingUp,
    Award,
    Calendar,
    Search,
    Loader2
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AcademicSyncModal from "@/components/AcademicSyncModal";

const StudentAcademicsPage = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [selectedSemester, setSelectedSemester] = useState<string>("All Semesters");
    const [selectedSemester, setSelectedSemester] = useState<string>("All Semesters");

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await api.getStudentAcademics();
            setData(result);
        } catch (err) {
            console.error("Failed to load academics:", err);
            toast.error("Failed to load records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSyncComplete = () => {
        setIsSyncModalOpen(false);
        fetchData();
    };

    if (loading) {
        return (
            <DashboardLayout title="Academic Records" role="student">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    const { semesterCGPAs = [], records = [] } = data || {};
    const semesters = ["All Semesters", ...Array.from(new Set(records.map((r: any) => r.semester).filter((s: any) => s && s !== "All Semesters")))];

    const filteredRecords = records.filter((r: any) => {
        return selectedSemester === "All Semesters" || r.semester === selectedSemester;
    });

    return (
        <DashboardLayout
            title="Academic Records"
            subtitle="Performance and Marks"
            role="student"
        >
            <>
                <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 flex items-center gap-4 bg-card border p-6 rounded-2xl shadow-sm font-display">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <GraduationCap className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold">Sync Portal</h2>
                                <p className="text-xs text-muted-foreground">Update data from university</p>
                            </div>
                            <Button onClick={() => setIsSyncModalOpen(true)} size="sm">
                                <RefreshCw className="h-4 w-4 mr-2" /> Sync
                            </Button>
                        </div>
                        <div className="bg-card border p-6 rounded-2xl shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Overall CGPA</p>
                                <div className="text-2xl font-black text-primary">
                                    {semesterCGPAs.length > 0 
                                        ? (semesterCGPAs.reduce((acc: number, val: any) => acc + (val.cgpa || 0), 0) / semesterCGPAs.length).toFixed(2)
                                        : "0.00"}
                                </div>
                            </div>
                            <TrendingUp className="h-10 w-10 text-primary opacity-20" />
                        </div>
                    </div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <h3 className="font-bold text-lg">Progression</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {semesterCGPAs.length > 0 ? semesterCGPAs.map((sem: any, i: number) => (
                                <div key={i} className="bg-secondary/20 p-4 rounded-xl border relative group">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-muted-foreground">{sem.sem}</span>
                                        <span className="text-lg font-black text-primary">{sem.cgpa}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${(sem.cgpa / 10) * 100}%` }} />
                                    </div>
                                </div>
                            )) : <div className="col-span-4 text-center py-4 text-muted-foreground italic">No data.</div>}
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b flex justify-between items-center bg-secondary/5">
                            <h3 className="font-bold text-lg">Detailed Marks</h3>
                            <div className="flex gap-2">
                                <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="bg-background border p-2 rounded-xl text-xs outline-none">
                                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-secondary/10 text-[10px] uppercase font-bold text-muted-foreground border-b">
                                    <tr>
                                        <th className="px-6 py-4">Code</th>
                                        <th className="px-6 py-4">Subject</th>
                                        <th className="px-6 py-4">Credits</th>
                                        <th className="px-6 py-4">Internal</th>
                                        <th className="px-6 py-4">External</th>
                                        <th className="px-6 py-4">Total</th>
                                        <th className="px-6 py-4">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.length > 0 ? filteredRecords.map((r: any, i: number) => (
                                        <tr key={i} className="border-b hover:bg-secondary/10 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs">{r.code}</td>
                                            <td className="px-6 py-4 text-sm font-semibold">{r.subject.name || r.subject}</td>
                                            <td className="px-6 py-4 text-sm font-bold">{r.subject.credits || "—"}</td>
                                            <td className="px-6 py-4 text-sm">{r.internalMarks || "—"}</td>
                                            <td className="px-6 py-4 text-sm">{r.externalMarks || "—"}</td>
                                            <td className="px-6 py-4 text-sm font-bold">{r.marks}/100</td>
                                            <td className="px-6 py-4 text-sm font-bold text-primary">{r.grade || "—"}</td>
                                        </tr>
                                    )) : <tr><td colSpan={6} className="px-6 py-10 text-center italic text-muted-foreground">No records.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>

                <AcademicSyncModal 
                    isOpen={isSyncModalOpen} 
                    onClose={() => setIsSyncModalOpen(false)} 
                    onSuccess={handleSyncComplete} 
                />
            </>
        </DashboardLayout>
    );
};

export default StudentAcademicsPage;
