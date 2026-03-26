import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Brain,
    TrendingUp,
    Target,
    Zap,
    BookOpen,
    AlertTriangle,
    CheckCircle,
    Lightbulb,
    BarChart3,
    Sparkles,
    Loader2,
} from "lucide-react";
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";

const iconMap: Record<string, any> = {
    AlertTriangle,
    TrendingUp,
    BookOpen,
    Zap,
    CheckCircle,
};

const tooltipStyle = {
    background: "#ffffff",
    border: "1px solid hsl(220, 13%, 91%)",
    borderRadius: "8px",
    color: "hsl(220, 14%, 10%)",
};

const AIAnalysis = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [customTarget, setCustomTarget] = useState("");
    const [customGoals, setCustomGoals] = useState<any[]>([]);

    const addCustomGoal = () => {
        const target = parseFloat(customTarget);
        if (isNaN(target) || target <= 0 || target > 10) return;
        if (!data || data.currentSem == null) return;
        
        const { currentCgpa, currentSem, totalSems } = data;
        const remainingSems = totalSems - currentSem;
        if (remainingSems <= 0) return;

        const requiredSgpaAvg = (target * totalSems - currentCgpa * currentSem) / remainingSems;

        let feasibility = "Very Likely";
        let color = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
        let needed = "";

        if (requiredSgpaAvg > 10) {
            feasibility = "Impossible";
            color = "text-rose-500 bg-rose-500/10 border-rose-500/20";
            needed = `Requires >10 SGPA on average the rest of the way.`;
        } else if (requiredSgpaAvg > 9.0) {
            feasibility = "Challenging";
            color = "text-amber-500 bg-amber-500/10 border-amber-500/20";
            needed = `Require average SGPA of ${requiredSgpaAvg.toFixed(2)} in remaining ${remainingSems} sems.`;
        } else if (requiredSgpaAvg <= currentCgpa) {
            feasibility = "Very Likely";
            color = "text-blue-500 bg-blue-500/10 border-blue-500/20";
            needed = `Just maintain your current trajectory (need ~${requiredSgpaAvg.toFixed(2)} SGPA).`;
        } else {
            feasibility = "Possible";
            color = "text-purple-500 bg-purple-500/10 border-purple-500/20";
            needed = `Require average SGPA of ${requiredSgpaAvg.toFixed(2)} in remaining ${remainingSems} sems.`;
        }

        const newGoal = {
            target: `${target.toFixed(2)} CGPA`,
            needed,
            feasibility,
            color
        };

        setCustomGoals([newGoal, ...customGoals]);
        setCustomTarget("");
    };

    useEffect(() => {
        if (data) {
            sessionStorage.setItem('bot_page_context', JSON.stringify({
                page: "AI Analytics",
                predictedGPA: data.predictedGPA,
                overallTrend: data.overallTrend,
                weakAreas: data.weakAreas,
                suggestions: data.suggestions
            }));
        }
        return () => sessionStorage.removeItem('bot_page_context');
    }, [data]);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const analysisData = await api.getAIAnalysis();
                setData(analysisData);
            } catch (err) {
                console.error("Failed to fetch analysis:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, []);

    if (loading) {
        return (
            <DashboardLayout title="AI Analytics" subtitle="Analyzing your academic path..." role="student">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!data) {
        return (
            <DashboardLayout title="AI Analytics" subtitle="Something went wrong" role="student">
                <div className="text-center py-20">
                    <p className="text-muted-foreground text-sm">Could not generate analysis. Please try again later.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="AI Analytics" subtitle="AI-driven performance and growth insights" role="student">
            {/* Overall Score */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-emerald-500/5 to-accent/5 p-6 mb-8"
            >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-lg shrink-0">
                        <Brain className="h-10 w-10 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-display font-bold text-foreground mb-1">AI Academic Analysis</h2>
                        <p className="text-sm text-muted-foreground mb-3">
                            Based on your academic scores, coding activity, and attendance patterns, here's your comprehensive AI-driven insights.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Overall Trend</p>
                                    <p className="text-sm font-semibold text-emerald-500">{data.overallTrend}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Predicted Next GPA</p>
                                    <p className="text-sm font-semibold text-primary">{data.predictedGPA?.toFixed(1) || "—"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Areas to Watch</p>
                                    <p className="text-sm font-semibold text-amber-500 truncate max-w-[150px]">{data.weakAreas || "None"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Strength/Weakness Radar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <h3 className="font-display font-semibold text-foreground mb-1">Strength & Weakness Map</h3>
                    <p className="text-xs text-muted-foreground mb-4">Your competency across subjects</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={data.strengthData}>
                            <PolarGrid stroke="hsl(220, 13%, 91%)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }} />
                            <PolarRadiusAxis tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 10 }} domain={[0, 100]} />
                            <Radar
                                name="Score"
                                dataKey="score"
                                stroke="hsl(234, 89%, 56%)"
                                fill="hsl(234, 89%, 56%)"
                                fillOpacity={0.2}
                                strokeWidth={2}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* GPA Prediction */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <h3 className="font-display font-semibold text-foreground mb-1">CGPA Trajectory</h3>
                    <p className="text-xs text-muted-foreground mb-4">Actual performance vs AI-predicted path</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data.predictionData}>
                            <defs>
                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(234, 89%, 56%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(234, 89%, 56%)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(250, 80%, 60%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(250, 80%, 60%)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                            <XAxis dataKey="sem" tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 11 }} axisLine={false} />
                            <YAxis tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 11 }} axisLine={false} domain={[0, 10]} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="actual" stroke="hsl(234, 89%, 56%)" fill="url(#colorActual)" strokeWidth={2} name="Actual" connectNulls />
                            <Area type="monotone" dataKey="predicted" stroke="hsl(250, 80%, 60%)" fill="url(#colorPredicted)" strokeWidth={2} strokeDasharray="5 5" name="Predicted" connectNulls />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Personalized Suggestions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-border bg-card p-6 mb-8"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <h3 className="font-display font-semibold text-foreground">AI-Driven Personalized Suggestions</h3>
                </div>
                {data.suggestions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.suggestions.map((s: any, i: number) => {
                            const Icon = iconMap[s.icon] || Sparkles;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                    className={`rounded-xl border p-4 ${s.color}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">{s.title}</h4>
                                            <p className="text-xs opacity-80 leading-relaxed">{s.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground italic">No urgent suggestions at this time. Keep up the good work!</p>
                )}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Goal Simulator Placeholder (Could be expanded later) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="h-5 w-5 text-primary" />
                        <h3 className="font-display font-semibold text-foreground">Goal Roadmap</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">What you need to reach target CGPAs</p>
                    <div className="flex items-center gap-2 mb-4">
                        <input 
                            type="number" 
                            step="0.1" 
                            min={data?.currentCgpa || 0} 
                            max="10" 
                            placeholder="Custom Target CGPA" 
                            value={customTarget}
                            onChange={(e) => setCustomTarget(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addCustomGoal()}
                            className="flex-1 h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        <button 
                            onClick={addCustomGoal}
                            className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-all"
                        >
                            Analyze
                        </button>
                    </div>
                    <div className="space-y-4">
                        {[...customGoals, ...(data.goalRoadmap || [])].map((g: any, i: number) => (
                            <div key={i} className={`rounded-xl border p-4 ${g.color || 'bg-secondary/20 border-border'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-display font-bold ${g.color ? g.color.split(' ')[0] : 'text-foreground'}`}>{g.target}</span>
                                    <span className={`text-xs font-medium ${g.color ? g.color.split(' ')[0] : ''}`}>{g.feasibility}</span>
                                </div>
                                <p className={`text-xs ${g.color ? g.color.split(' ')[0] : 'text-muted-foreground'}`}>{g.needed}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Explainable AI */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-emerald-500" />
                        <h3 className="font-display font-semibold text-foreground">AI Logic & Reasoning Hub</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Deep insights into the factors driving your performance</p>
                    <div className="space-y-4">
                        {data.insights.map((insight: any, i: number) => (
                            <div key={i} className="rounded-xl border border-border p-4 bg-secondary/20">
                                <div className="flex items-start gap-3">
                                    <span className="text-lg">{insight.icon}</span>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-1">{insight.question}</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{insight.answer}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default AIAnalysis;
