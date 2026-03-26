import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Target,
    TrendingUp,
    Award,
    BookOpen,
    Code,
    Briefcase,
    ExternalLink,
    CheckCircle,
    Star,
    Zap,
    Trophy,
    Loader2,
    Search,
    ChevronRight,
    Sparkles,
} from "lucide-react";
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import api, { CareerAnalysis } from "@/lib/api";

const CareerPage = () => {
    const [goal, setGoal] = useState("Full Stack Developer");
    const [data, setData] = useState<CareerAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const goals = [
        "Full Stack Developer",
        "Backend Developer",
        "Frontend Developer",
        "Data Scientist",
        "Cloud Engineer",
        "AI/ML Engineer",
        "Cybersecurity Analyst",
        "UI/UX Designer"
    ];

    const [error, setError] = useState<string | null>(null);

    const fetchAnalysis = async (targetGoal: string) => {
        setIsRefreshing(true);
        setError(null);
        
        try {
            const result = await api.getCareerAnalysis(targetGoal);
            setData(result);
        } catch (err) {
            console.error("Failed to load career analysis:", err);
            setError("Unable to calculate profile readiness. Please check your connection.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalysis(goal);
    }, []);

    const handleGoalChange = (newGoal: string) => {
        setGoal(newGoal);
        fetchAnalysis(newGoal);
    };

    if (loading && !data) {
        return (
            <DashboardLayout title="Career & Skills" subtitle="Analyzing your potential..." role="student">
                <div className="flex flex-col items-center justify-center py-32 space-y-6 relative overflow-hidden">
                    <div className="absolute inset-0 dot-pattern opacity-30" />
                    <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2 relative">
                        <h2 className="text-xl font-display font-bold text-foreground shimmer">Calibrating Analysis Hub</h2>
                        <p className="text-sm text-muted-foreground">Aggregating real-time profile metrics...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Career & Skills" subtitle="Placement readiness & skill development" role="student">
            <div className="relative">
                {/* Background Pattern */}
                <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
                <div className="absolute top-48 -left-24 h-96 w-96 rounded-full bg-orange-500/5 blur-[100px] pointer-events-none" />

                {/* Goal Selector */}
                <div className="mb-8 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <h2 className="text-2xl font-display font-bold text-foreground tracking-tight">Career Architecture</h2>
                            </div>
                            <p className="text-sm text-muted-foreground">Select your industry target for a deep-dive analysis</p>
                        </div>
                        <div className="inline-flex p-1.5 rounded-2xl bg-secondary/50 border border-border backdrop-blur-md overflow-x-auto max-w-full hide-scrollbar">
                            <div className="flex gap-1.5 min-w-max">
                                {goals.map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => handleGoalChange(g)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 relative ${
                                            goal === g 
                                            ? "text-white shadow-glow translate-y-[-1px]" 
                                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                        }`}
                                    >
                                        {goal === g && (
                                            <motion.div
                                                layoutId="activeGoal"
                                                className="absolute inset-0 bg-primary rounded-xl z-0"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-10">{g}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Error State */}
                    {error && !data && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-12 text-center mb-8 backdrop-blur-sm shadow-glow"
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-glow-lg">
                                    <Zap className="h-8 w-8 text-rose-500 animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-display font-bold text-foreground">Analysis Hub Offline</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">{error}</p>
                                </div>
                                <button
                                    onClick={() => fetchAnalysis(goal)}
                                    className="mt-4 px-8 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-glow hover:shadow-glow-lg transition-all active:scale-95"
                                >
                                    Failsafe Recovery
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Placement Readiness Hero */}
                    {data && (
                        <motion.div
                            key={goal + "-readiness"}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-[32px] border border-border bg-card/40 relative overflow-hidden mb-10 backdrop-blur-md group"
                        >
                            <div className="absolute inset-0 animated-border opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                            
                            {isRefreshing && (
                                <div className="absolute inset-0 bg-card/40 backdrop-blur-[2px] z-20 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            )}

                            <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-10">
                                <div className="relative">
                                    {/* Glowing Ring */}
                                    <div className="absolute inset-[-12px] rounded-3xl bg-primary/10 blur-xl animate-pulse" />
                                    <div className="absolute inset-[-4px] rounded-[28px] border-2 border-primary/20" />
                                    
                                    <div className="h-40 w-40 rounded-[24px] bg-card border border-primary/10 flex items-center justify-center relative z-10 shadow-glow-lg group-hover:shadow-primary/20 transition-all duration-500">
                                        <div className="text-center">
                                            <motion.div 
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.2, type: "spring" }}
                                                className="text-5xl font-display font-black text-primary tracking-tighter"
                                            >
                                                {data.placementScore}
                                            </motion.div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1 opacity-60">Readiness</div>
                                        </div>
                                    </div>
                                    
                                    {/* Floating Badges */}
                                    <div className="absolute -top-3 -right-3 h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg border-2 border-card rotate-12 group-hover:rotate-0 transition-transform">
                                        <Trophy className="h-5 w-5" />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-6 text-center md:text-left">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-center md:justify-start gap-3">
                                            <h2 className="text-3xl font-display font-black text-foreground">{goal} Analysis</h2>
                                            {data.placementScore > 80 && (
                                                <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black border border-emerald-500/20 flex items-center gap-1.5 uppercase tracking-wider">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Professional Tier
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl font-medium">
                                            {data.summary}
                                        </p>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-border/50">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Global Ranking Alignment</span>
                                            <span className="text-sm font-bold text-primary font-display">{data.placementScore}% Optimized</span>
                                        </div>
                                        <div className="w-full h-4 rounded-full bg-secondary/50 p-1 relative overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${data.placementScore}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)] relative"
                                            >
                                                <div className="absolute inset-0 bg-white/20 shimmer rounded-full" />
                                            </motion.div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Discovery Phase</span>
                                            <span className="text-[9px] font-bold text-primary uppercase opacity-50">Market Saturation</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {data && (
                    <div className="space-y-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Skill Radar */}
                            <motion.div
                                key={goal + "-gap"}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="rounded-[24px] border border-border bg-card/60 p-8 backdrop-blur-sm tech-card"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <Target className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-display font-bold text-foreground tracking-tight">Technical Spectrum</h3>
                                            <p className="text-[11px] text-muted-foreground">Comparative Industry Benchmark</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="h-[340px] w-full relative">
                                    <div className="absolute inset-0 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={data.skillGap} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                                            <PolarGrid stroke="hsl(var(--border) / 0.5)" gridType="polygon" />
                                            <PolarAngleAxis 
                                                dataKey="skill" 
                                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }} 
                                            />
                                            <PolarRadiusAxis 
                                                tick={{ fill: "transparent" }} 
                                                axisLine={false} 
                                                domain={[0, 100]} 
                                            />
                                            <Radar 
                                                name="Profile Strength" 
                                                dataKey="student" 
                                                stroke="hsl(var(--primary))" 
                                                fill="url(#radarGradient)" 
                                                fillOpacity={0.4} 
                                                strokeWidth={3} 
                                                animationDuration={1500}
                                            />
                                            <Radar 
                                                name="Industry Target" 
                                                dataKey="industry" 
                                                stroke="hsl(var(--foreground) / 0.2)" 
                                                fill="transparent" 
                                                strokeWidth={1} 
                                                strokeDasharray="4 4" 
                                            />
                                            <defs>
                                                <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                                                    <stop offset="100%" stopColor="hsl(var(--primary) / 0.2)" />
                                                </linearGradient>
                                            </defs>
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex items-center justify-center gap-10 mt-6 pb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-3 w-3 rounded-full bg-primary shadow-glow" />
                                        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Your Mastery</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-3 w-3 rounded-full border-2 border-dashed border-border" />
                                        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Industry Goal</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Strategic Certifications */}
                            <motion.div
                                key={goal + "-certs"}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="rounded-[24px] border border-border bg-card/60 p-8 backdrop-blur-sm tech-card"
                            >
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                        <Award className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-display font-bold text-foreground tracking-tight">Credentials Hub</h3>
                                        <p className="text-[11px] text-muted-foreground">Strategic Accreditation Roadmap</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {data.recommendations.certifications.map((cert, i) => (
                                        <motion.div 
                                            key={cert.title} 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + (i * 0.1) }}
                                            className="rounded-2xl border border-border/50 p-5 bg-card/50 hover:bg-white/5 transition-all cursor-pointer group hover:border-primary/40 glass hover:shadow-glow-lg"
                                        >
                                            <div className="flex items-start gap-5">
                                                <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-3xl shadow-sm border border-border group-hover:scale-110 transition-transform duration-300">
                                                    {cert.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className="text-base font-black text-foreground truncate group-hover:text-primary transition-colors">{cert.title}</h4>
                                                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-3 group-hover:translate-x-0">
                                                            <ExternalLink className="h-4 w-4 text-primary" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-bold text-muted-foreground">{cert.platform}</span>
                                                        <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                        <span className="text-xs font-bold text-muted-foreground">{cert.time}</span>
                                                    </div>
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.15em] border ${
                                                            cert.relevance === "Critical" ? "bg-rose-500/10 text-rose-500 border-rose-500/30" :
                                                            "bg-primary/10 text-primary border-primary/30"
                                                        }`}>
                                                            {cert.relevance} Priority
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* High-Impact Projects */}
                            <motion.div
                                key={goal + "-projects"}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="rounded-[24px] border border-border bg-card/60 p-8 backdrop-blur-sm card-hover shadow-xl"
                            >
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                        <Code className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-display font-bold text-foreground tracking-tight">Innovation Portfolio</h3>
                                        <p className="text-[11px] text-muted-foreground">High-Impact System Architecture</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {data.recommendations.projects.map((project, i) => (
                                        <motion.div 
                                            key={project.title}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.4 + (i * 0.1) }}
                                            className="rounded-3xl border border-border/50 p-6 bg-gradient-to-br from-secondary/30 to-transparent hover:to-primary/5 transition-all group border-l-4 border-l-primary/40 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Code className="h-20 w-20 rotate-12" />
                                            </div>
                                            <div className="flex items-center justify-between mb-3 relative z-10">
                                                <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{project.title}</h4>
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-sm ${
                                                    project.impact === "High" ? "bg-primary text-white border-primary" : "bg-muted text-muted-foreground border-border"
                                                }`}>
                                                    {project.impact} IMPACT
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-5 leading-relaxed font-medium relative z-10">{project.description}</p>
                                            <div className="flex flex-wrap gap-2 relative z-10">
                                                {project.skills.map((skill) => (
                                                    <span key={skill} className="text-[10px] px-3 py-1 rounded-lg bg-card border border-border text-foreground font-bold group-hover:border-primary/30 transition-colors">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Competitive Landscape */}
                            <motion.div
                                key={goal + "-competitions"}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="rounded-[24px] border border-border bg-card/60 p-8 backdrop-blur-sm card-hover shadow-xl"
                            >
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                        <Trophy className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-display font-bold text-foreground tracking-tight">Elite Gatherings</h3>
                                        <p className="text-[11px] text-muted-foreground">Networking & Competitive Benchmark</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {data.recommendations.competitions.map((comp, i) => (
                                        <motion.div 
                                            key={comp.title}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + (i * 0.1) }}
                                            className="rounded-2xl border border-border/50 p-5 bg-card/40 hover:bg-secondary/20 transition-all cursor-pointer group relative overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-base font-black text-foreground group-hover:text-primary transition-colors">{comp.title}</h4>
                                                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary transition-colors text-muted-foreground group-hover:text-white">
                                                    <ChevronRight className="h-5 w-5" />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="px-2 py-1 rounded-lg bg-secondary text-[10px] font-bold text-muted-foreground flex items-center gap-1.5">
                                                    <Briefcase className="h-3 w-3" />
                                                    {comp.type}
                                                </div>
                                                <div className="px-2 py-1 rounded-lg bg-secondary text-[10px] font-bold text-muted-foreground flex items-center gap-1.5">
                                                    <Target className="h-3 w-3" />
                                                    {comp.date}
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <div className={`text-[10px] font-black px-3 py-1 rounded-lg border flex items-center gap-2 ${
                                                    comp.difficulty === "Hard" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                                    comp.difficulty === "Medium" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                }`}>
                                                    <div className={`h-1.5 w-1.5 rounded-full ${
                                                        comp.difficulty === "Hard" ? "bg-rose-500" :
                                                        comp.difficulty === "Medium" ? "bg-amber-500" : "bg-emerald-500"
                                                    }`} />
                                                    {comp.difficulty} LEVEL
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CareerPage;
