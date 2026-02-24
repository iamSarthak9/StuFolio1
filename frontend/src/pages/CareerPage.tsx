import { motion } from "framer-motion";
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

const skillGapData = [
    { skill: "DSA", student: 82, industry: 90 },
    { skill: "Web Dev", student: 70, industry: 85 },
    { skill: "System Design", student: 45, industry: 80 },
    { skill: "Databases", student: 88, industry: 85 },
    { skill: "DevOps", student: 30, industry: 70 },
    { skill: "ML/AI", student: 55, industry: 75 },
];

const certifications = [
    { title: "AWS Cloud Practitioner", platform: "AWS", relevance: "High", time: "30 hours", icon: "☁️" },
    { title: "Docker & Kubernetes", platform: "Coursera", relevance: "High", time: "25 hours", icon: "🐳" },
    { title: "System Design Basics", platform: "Educative", relevance: "Critical", time: "20 hours", icon: "🏗️" },
    { title: "React Advanced Patterns", platform: "Frontend Masters", relevance: "Medium", time: "15 hours", icon: "⚛️" },
];

const projects = [
    { title: "Full-Stack E-Commerce Platform", skills: ["React", "Node.js", "MongoDB", "Stripe"], impact: "High", description: "Build a complete marketplace with auth, payments, and admin dashboard." },
    { title: "Real-Time Chat Application", skills: ["WebSocket", "React", "Redis", "Docker"], impact: "High", description: "Create a scalable chat app with rooms, typing indicators, and message history." },
    { title: "ML-Powered Resume Parser", skills: ["Python", "NLP", "FastAPI", "React"], impact: "Medium", description: "Build an AI tool that extracts skills and experience from PDF resumes." },
];

const competitions = [
    { title: "Google Kickstart 2026", date: "Mar 15, 2026", type: "Coding Contest", difficulty: "Medium-Hard" },
    { title: "MLH Global Hack Week", date: "Mar 20-27, 2026", type: "Hackathon", difficulty: "All Levels" },
    { title: "ICPC Regional Qualifier", date: "Apr 5, 2026", type: "Competitive Programming", difficulty: "Hard" },
    { title: "Smart India Hackathon", date: "Apr 15, 2026", type: "Hackathon", difficulty: "Medium" },
];

const CareerPage = () => {
    const placementScore = 72;

    return (
        <DashboardLayout title="Career & Skills" subtitle="Placement readiness & skill development" role="student">
            {/* Placement Readiness */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-6 mb-8"
            >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="relative">
                        <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-3xl font-display font-extrabold text-primary">{placementScore}</div>
                                <div className="text-[10px] text-muted-foreground">out of 100</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-display font-bold text-foreground mb-1">Placement Readiness Score</h2>
                        <p className="text-sm text-muted-foreground mb-3">
                            You're <span className="text-primary font-medium">72% ready</span> for placement season. Focus on System Design and DevOps to close the gap.
                        </p>
                        <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${placementScore}%` }}
                                transition={{ delay: 0.5, duration: 1 }}
                                className="h-full rounded-full bg-gradient-primary"
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">Beginner</span>
                            <span className="text-[10px] text-muted-foreground">Industry Ready</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Skill Gap Analysis */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="h-5 w-5 text-primary" />
                        <h3 className="font-display font-semibold text-foreground">Skill Gap Analysis</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Your skills vs industry requirements</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={skillGapData}>
                            <PolarGrid stroke="hsl(220, 16%, 14%)" />
                            <PolarAngleAxis dataKey="skill" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 11 }} />
                            <PolarRadiusAxis tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10 }} domain={[0, 100]} />
                            <Radar name="You" dataKey="student" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.2} strokeWidth={2} />
                            <Radar name="Industry" dataKey="industry" stroke="hsl(160, 84%, 39%)" fill="hsl(160, 84%, 39%)" fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
                        </RadarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-6 mt-2">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-xs text-muted-foreground">Your Skills</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-accent" />
                            <span className="text-xs text-muted-foreground">Industry Standard</span>
                        </div>
                    </div>
                </motion.div>

                {/* Recommended Certifications */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="h-5 w-5 text-warning" />
                        <h3 className="font-display font-semibold text-foreground">Recommended Certifications</h3>
                    </div>
                    <div className="space-y-3">
                        {certifications.map((cert) => (
                            <div key={cert.title} className="rounded-xl border border-border p-4 bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer group">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{cert.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-sm font-semibold text-foreground truncate">{cert.title}</h4>
                                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{cert.platform} · {cert.time}</p>
                                        <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded ${cert.relevance === "Critical" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                                            cert.relevance === "High" ? "bg-primary/10 text-primary border border-primary/20" :
                                                "bg-secondary text-muted-foreground border border-border"
                                            }`}>
                                            {cert.relevance} Relevance
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Recommendations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Code className="h-5 w-5 text-accent" />
                        <h3 className="font-display font-semibold text-foreground">Resume-Worthy Projects</h3>
                    </div>
                    <div className="space-y-4">
                        {projects.map((project) => (
                            <div key={project.title} className="rounded-xl border border-border p-4 bg-secondary/20">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-semibold text-foreground">{project.title}</h4>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${project.impact === "High" ? "bg-accent/10 text-accent border border-accent/20" : "bg-primary/10 text-primary border border-primary/20"
                                        }`}>{project.impact} Impact</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{project.description}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {project.skills.map((skill) => (
                                        <span key={skill} className="text-[10px] px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Competitions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="h-5 w-5 text-amber-400" />
                        <h3 className="font-display font-semibold text-foreground">Upcoming Competitions</h3>
                    </div>
                    <div className="space-y-3">
                        {competitions.map((comp) => (
                            <div key={comp.title} className="rounded-xl border border-border p-4 bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-semibold text-foreground">{comp.title}</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">{comp.date}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{comp.type}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground">{comp.difficulty}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default CareerPage;
