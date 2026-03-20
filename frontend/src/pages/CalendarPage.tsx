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
import PlatformIcon from "@/components/PlatformIcon";
import { cn } from "@/lib/utils";

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
    exam: { color: "text-primary", bg: "bg-primary/10 border-primary/30", icon: GraduationCap },
    study: { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30", icon: BookOpen },
};

const getPlatformColors = (platform?: string) => {
    const p = platform?.toLowerCase() || "";
    if (p.includes("leetcode")) return "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400";
    if (p.includes("codeforces")) return "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400";
    if (p.includes("codechef")) return "bg-orange-600/10 border-orange-600/40 text-orange-700 dark:text-orange-400";
    if (p.includes("atcoder")) return "bg-purple-500/10 border-purple-500/40 text-purple-600 dark:text-purple-400";
    return "bg-primary/10 border-primary/40 text-primary";
};

const CalendarPage = () => {
    const todayObj = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(todayObj.getFullYear(), todayObj.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState<string | null>(todayObj.toISOString().split("T")[0]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["LeetCode", "Codeforces", "CodeChef", "AtCoder", "HackerRank", "Google"]);
    const [apiEvents, setApiEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const platforms = ["LeetCode", "Codeforces", "CodeChef", "AtCoder", "HackerRank", "Google"];

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                // Fetch for current month ± 1 for smooth transitions
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

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = todayObj.toISOString().split("T")[0];

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    const getDateKey = (day: number) => {
        const m = String(month + 1).padStart(2, "0");
        const d = String(day).padStart(2, "0");
        return `${year}-${m}-${d}`;
    };

    // Group events by date key and filter by platform
    const filteredEvents = apiEvents.filter(e => 
        e.type !== "contest" || !e.platform || selectedPlatforms.includes(e.platform)
    );

    const eventsByDate: Record<string, CalendarEvent[]> = filteredEvents.reduce((acc, event) => {
        const key = new Date(event.date).toISOString().split("T")[0];
        if (!acc[key]) acc[key] = [];
        acc[key].push(event);
        return acc;
    }, {} as Record<string, CalendarEvent[]>);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const togglePlatform = (p: string) => {
        setSelectedPlatforms(prev => 
            prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
        );
    };

    const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

    // Upcoming events sorted
    const allUpcoming = apiEvents
        .filter((e) => new Date(e.date).toISOString().split("T")[0] >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6);

    return (
        <DashboardLayout title="Calendar" subtitle="Contests, deadlines & exam schedule" role="student">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 rounded-xl border border-border bg-card p-6"
                >
                    {/* Month nav */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h3 className="font-display text-xl font-bold text-foreground">{monthName} {year}</h3>
                        
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex bg-secondary/50 p-1 rounded-xl border border-border mr-2">
                                {platforms.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => togglePlatform(p)}
                                        className={cn(
                                            "px-2 py-1 text-[10px] font-bold rounded-lg transition-all",
                                            selectedPlatforms.includes(p) 
                                                ? "bg-primary text-white shadow-sm" 
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button onClick={prevMonth} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button onClick={nextMonth} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, i) => {
                            if (day === null) return <div key={`empty-${i}`} />;
                            const dateKey = getDateKey(day);
                            const dayEvents = eventsByDate[dateKey] || [];
                            const hasEvents = dayEvents.length > 0;
                            const isToday = dateKey === today;
                            const isSelected = dateKey === selectedDate;

                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDate(dateKey)}
                                    className={`relative h-12 sm:h-14 rounded-lg text-sm font-medium transition-all ${isSelected
                                            ? "bg-primary text-white shadow-glow"
                                            : isToday
                                                ? "bg-primary/10 text-primary border border-primary/30"
                                                : "text-foreground hover:bg-secondary/50"
                                        }`}
                                >
                                    {day}
                                    {hasEvents && !isSelected && (
                                        <div className="absolute bottom-1 left-0 right-0 px-1 overflow-hidden h-4 flex flex-wrap justify-center gap-0.5">
                                            {dayEvents.map((e, j) => (
                                                <div 
                                                    key={j} 
                                                    className={cn(
                                                        "h-1.5 w-1.5 rounded-full",
                                                        e.type === "contest" ? "bg-amber-500" :
                                                        e.type === "deadline" ? "bg-red-500" : "bg-primary"
                                                    )} 
                                                />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                        {Object.entries(typeConfig).map(([type, config]) => (
                            <div key={type} className="flex items-center gap-1.5">
                                <div className={`h-2 w-2 rounded-full ${config.color.replace("text-", "bg-")}`} />
                                <span className="text-xs text-muted-foreground capitalize">{type}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Sidebar - Events */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                >
                    {/* Selected day events */}
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h3 className="font-display font-semibold text-foreground mb-1">
                            {selectedDate ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "Select a date"}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
                        </p>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : selectedEvents.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">No events on this day</p>
                        ) : (
                            <div className="space-y-3">
                                {selectedEvents.map((event, i) => {
                                    const config = typeConfig[event.type] || typeConfig.study;
                                    const platformColors = event.type === "contest" ? getPlatformColors(event.platform) : config.bg + " " + config.color;
                                    
                                    const Content = (
                                        <div key={i} className={cn(
                                            "rounded-xl border-2 p-4 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm",
                                            platformColors
                                        )}>
                                            <div className="flex items-start gap-4">
                                                <div className="mt-0.5">
                                                    {event.type === "contest" ? (
                                                        <PlatformIcon platform={event.platform} className="h-5 w-5" />
                                                    ) : (
                                                        <config.icon className="h-5 w-5" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate leading-tight">{event.title}</p>
                                                    {event.platform && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{event.platform}</span>
                                                            {event.duration && (
                                                                <>
                                                                    <span className="h-1 w-1 rounded-full bg-current opacity-40" />
                                                                    <span className="text-[10px] font-bold opacity-80">{event.duration}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2 opacity-70">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="text-[10px] font-medium">
                                                            {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );

                                    return event.link ? (
                                        <a href={event.link} target="_blank" rel="noopener noreferrer" key={event.id || i}>
                                            {Content}
                                        </a>
                                    ) : Content;
                                })}
                            </div>
                        )}
                    </div>

                    {/* Upcoming events */}
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h3 className="font-display font-semibold text-foreground mb-1">Upcoming</h3>
                        <p className="text-xs text-muted-foreground mb-4">Next events</p>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary/30" />
                                </div>
                            ) : allUpcoming.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2 text-center">No upcoming events</p>
                            ) : (
                                allUpcoming.map((event, i) => {
                                    const config = typeConfig[event.type] || typeConfig.study;
                                    const dateObj = new Date(event.date);
                                    const Content = (
                                        <div
                                            key={event.id || i}
                                            onClick={() => {
                                                const d = dateObj.toISOString().split("T")[0];
                                                setSelectedDate(d);
                                                setCurrentDate(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1));
                                            }}
                                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer"
                                        >
                                            <div className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                                                <config.icon className={`h-3.5 w-3.5 ${config.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-foreground truncate">{event.title}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                    {event.platform ? ` · ${event.platform}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                    return event.link ? (
                                        <a href={event.link} target="_blank" rel="noopener noreferrer" key={event.id || i}>
                                            {Content}
                                        </a>
                                    ) : Content;
                                })
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default CalendarPage;
