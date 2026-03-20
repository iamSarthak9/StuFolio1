import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Code,
    BookOpen,
    GraduationCap,
    Clock,
    Trophy,
    Loader2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import ContestModal from "@/components/ContestModal";

interface CalendarEvent {
    id: string;
    title: string;
    type: string;
    date: string | Date;
    platform?: string;
    link?: string;
    duration?: string;
}

const typeConfig: Record<string, { color: string; bg: string; icon: typeof Code }> = {
    contest: { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30", icon: Trophy },
    deadline: { color: "text-red-500", bg: "bg-red-500/10 border-red-500/30", icon: Clock },
    exam: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30", icon: GraduationCap },
    study: { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30", icon: BookOpen },
};

const getPlatformColors = (platform?: string) => {
    const p = platform?.toLowerCase() || "";
    if (p.includes("codeforces")) return "bg-[#3498DB]/10 border-[#3498DB]/30 text-[#3498DB]";
    if (p.includes("leetcode")) return "bg-[#F1C40F]/10 border-[#F1C40F]/30 text-[#F1C40F]";
    if (p.includes("atcoder")) return "bg-[#A29BFE]/10 border-[#A29BFE]/30 text-[#A29BFE]";
    if (p.includes("codechef")) return "bg-[#E67E22]/10 border-[#E67E22]/30 text-[#E67E22]";
    return "bg-primary/10 border-primary/30 text-primary";
};

const getPlatformDot = (platform?: string) => {
    const p = platform?.toLowerCase() || "";
    if (p.includes("codeforces")) return "bg-[#3498DB]";
    if (p.includes("leetcode")) return "bg-[#F1C40F]";
    if (p.includes("atcoder")) return "bg-[#A29BFE]";
    if (p.includes("codechef")) return "bg-[#E67E22]";
    return "bg-primary";
};

const CalendarPage = () => {
    const todayObj = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(todayObj.getFullYear(), todayObj.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState<string | null>(todayObj.toISOString().split("T")[0]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["LeetCode", "Codeforces", "CodeChef", "AtCoder", "HackerRank", "Google"]);
    const [apiEvents, setApiEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContest, setSelectedContest] = useState<CalendarEvent | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const platforms = ["LeetCode", "Codeforces", "CodeChef", "AtCoder", "HackerRank", "Google"];

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const data = await api.getEvents();
                setApiEvents(data as CalendarEvent[]);
            } catch (err) {
                console.error("Failed to fetch events:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [currentDate.getMonth(), currentDate.getFullYear()]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleString("default", { month: "long" });
    const today = todayObj.toISOString().split("T")[0];

    const getDateKey = (y: number, m: number, d: number) => {
        return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    };

    // Prepare 42 cells for the calendar grid
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const daysInCurrMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        const m = month === 0 ? 12 : month;
        const y = month === 0 ? year - 1 : year;
        const dateKey = getDateKey(y, m, d);
        days.push({ day: d, dateKey, isCurrentMonth: false, isToday: dateKey === today });
    }
    // Current month
    for (let d = 1; d <= daysInCurrMonth; d++) {
        const dateKey = getDateKey(year, month + 1, d);
        days.push({ day: d, dateKey, isCurrentMonth: true, isToday: dateKey === today });
    }
    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
        const m = month === 11 ? 1 : month + 2;
        const y = month === 11 ? year + 1 : year;
        const dateKey = getDateKey(y, m, d);
        days.push({ day: d, dateKey, isCurrentMonth: false, isToday: dateKey === today });
    }

    const filteredEvents = apiEvents.filter(e => 
        e.type !== "contest" || !e.platform || selectedPlatforms.includes(e.platform)
    );

    const eventsByDate = filteredEvents.reduce((acc, event) => {
        const key = new Date(event.date).toISOString().split("T")[0];
        if (!acc[key]) acc[key] = [];
        acc[key].push(event);
        return acc;
    }, {} as Record<string, CalendarEvent[]>);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const togglePlatform = (p: string) => {
        setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    };

    const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

    return (
        <DashboardLayout title="Calendar" subtitle="Contests, deadlines & exam schedule" role="student">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Base */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 rounded-xl border border-[#27272A] bg-[#0A0A0A] p-6 shadow-xl"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-foreground">{monthName} {year}</h2>
                            <p className="text-sm text-muted-foreground mt-1">Global Contest Schedule</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex bg-[#111111] p-1 rounded-xl border border-[#27272A]">
                                {platforms.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => togglePlatform(p)}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                            selectedPlatforms.includes(p) 
                                                ? "bg-primary text-white shadow-md shadow-primary/20" 
                                                : "text-muted-foreground hover:text-white hover:bg-[#27272A]/80"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button onClick={prevMonth} className="h-9 w-9 rounded-xl border border-[#27272A] bg-[#111111] flex items-center justify-center text-foreground hover:bg-[#27272A] transition-all">
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button onClick={nextMonth} className="h-9 w-9 rounded-xl border border-[#27272A] bg-[#111111] flex items-center justify-center text-foreground hover:bg-[#27272A] transition-all">
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-0 mb-px">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                            <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-3 border-b border-[#27272A] uppercase tracking-widest">{d}</div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-px bg-[#27272A] border border-[#27272A] rounded-lg overflow-hidden">
                        {days.map((item) => {
                            const isSelected = selectedDate === item.dateKey;
                            const cellEvents = eventsByDate[item.dateKey] || [];

                            return (
                                <div
                                    key={item.dateKey}
                                    className={cn(
                                        "relative min-h-[100px] sm:min-h-[120px] p-1.5 transition-all cursor-pointer",
                                        !item.isCurrentMonth ? "bg-[#0A0A0A]/40" : "bg-[#111111]",
                                        isSelected && "ring-2 ring-inset ring-primary z-10 bg-primary/5"
                                    )}
                                    onClick={() => setSelectedDate(item.dateKey)}
                                >
                                    <div className={cn(
                                        "text-xs font-bold mb-1 ml-0.5",
                                        item.isToday ? "h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center" : 
                                        !item.isCurrentMonth ? "text-muted-foreground/20" : "text-muted-foreground/60"
                                    )}>
                                        {item.day}
                                    </div>

                                    <div className="space-y-1">
                                        {cellEvents.slice(0, 4).map((e, idx) => {
                                            const platformColors = getPlatformColors(e.platform);
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={(ev) => {
                                                        ev.stopPropagation();
                                                        setSelectedContest(e);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className={cn(
                                                        "w-full px-1.5 py-1 rounded-sm text-[9px] font-bold border truncate hover:brightness-150 transition-all shadow-sm",
                                                        platformColors
                                                    )}
                                                >
                                                    {e.title}
                                                </div>
                                            );
                                        })}
                                        {cellEvents.length > 4 && (
                                            <div className="text-[8px] font-bold text-muted-foreground/40 px-1 mt-0.5">
                                                +{cellEvents.length - 4} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Sidebar - TLE Style */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-1 space-y-4"
                >
                    <div className="rounded-xl border border-[#27272A] bg-[#111111] p-6 shadow-sm sticky top-24">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-display font-bold text-foreground">Next Up</h3>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
                                </div>
                            ) : selectedEvents.length === 0 ? (
                                <div className="py-12 text-center bg-[#0A0A0A]/50 rounded-xl border border-[#27272A]/50">
                                    <CalendarIcon className="h-12 w-12 text-muted-foreground/5 mx-auto mb-4" />
                                    <p className="text-sm font-medium text-muted-foreground/40 italic">Click a date to see contests</p>
                                </div>
                            ) : (
                                selectedEvents.map((event, i) => {
                                    const dateObj = new Date(event.date);
                                    const platformDot = getPlatformDot(event.platform);
                                    
                                    return (
                                        <div 
                                            key={event.id || i}
                                            onClick={() => {
                                                setSelectedContest(event);
                                                setIsModalOpen(true);
                                            }}
                                            className="group flex gap-4 cursor-pointer"
                                        >
                                            {/* Date Box */}
                                            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-[#27272A]/30 border border-[#27272A] shrink-0 overflow-hidden group-hover:border-primary/50 transition-all">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-[#A1A1AA] py-0.5 bg-[#27272A] w-full text-center">
                                                    {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                                                </span>
                                                <span className="text-xl font-bold text-white py-1 leading-none">
                                                    {dateObj.getDate()}
                                                </span>
                                            </div>

                                            {/* Contest Info */}
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <h4 className="text-[15px] font-semibold text-white truncate leading-snug group-hover:text-primary transition-colors mb-1.5">
                                                    {event.title}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={cn("h-1.5 w-1.5 rounded-full", platformDot)} />
                                                        <span className="text-sm font-bold text-[#A1A1AA]">
                                                            {event.platform || event.type}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[#A1A1AA]/60">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-bold">
                                                            {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            <ContestModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                contest={selectedContest}
            />
        </DashboardLayout>
    );
};

export default CalendarPage;
