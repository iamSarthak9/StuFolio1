import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Calendar,
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

interface CalendarEvent {
    id: string;
    title: string;
    type: string;
    date: string | Date;
    platform?: string;
    link?: string;
}

const typeConfig: Record<string, { color: string; bg: string; icon: typeof Code }> = {
    contest: { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", icon: Trophy },
    deadline: { color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", icon: Clock },
    exam: { color: "text-primary", bg: "bg-primary/10 border-primary/20", icon: GraduationCap },
    study: { color: "text-accent", bg: "bg-accent/10 border-accent/20", icon: BookOpen },
};

const CalendarPage = () => {
    const todayObj = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(todayObj.getFullYear(), todayObj.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState<string | null>(todayObj.toISOString().split("T")[0]);
    const [apiEvents, setApiEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

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

    // Group events by date key
    const eventsByDate: Record<string, CalendarEvent[]> = apiEvents.reduce((acc, event) => {
        const key = new Date(event.date).toISOString().split("T")[0];
        if (!acc[key]) acc[key] = [];
        acc[key].push(event);
        return acc;
    }, {} as Record<string, CalendarEvent[]>);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

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
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display text-xl font-bold text-foreground">{monthName} {year}</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={prevMonth} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button onClick={nextMonth} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                                <ChevronRight className="h-4 w-4" />
                            </button>
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
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                                            {dayEvents.slice(0, 3).map((e, j) => (
                                                <div key={j} className={`h-1 w-1 rounded-full ${e.type === "contest" ? "bg-amber-400" :
                                                        e.type === "deadline" ? "bg-destructive" :
                                                            "bg-primary"
                                                    }`} />
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
                                    const Content = (
                                        <div key={i} className={`rounded-xl border p-4 ${config.bg} transition-all hover:scale-[1.02] active:scale-95`}>
                                            <div className="flex items-start gap-3">
                                                <config.icon className={`h-4 w-4 shrink-0 mt-0.5 ${config.color}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                                                    {event.platform && (
                                                        <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">{event.platform}</p>
                                                    )}
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
