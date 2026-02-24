import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Users,
  Trophy,
  Brain,
  Shield,
  Calendar,
  Code,
  GraduationCap,
  Target,
  Sparkles,
  CheckCircle,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    icon: BarChart3,
    title: "Real-Time Dashboard",
    description: "Track CGPA, coding stats, and academic growth with beautiful live dashboards.",
    gradient: "from-blue-500/20 to-indigo-500/20",
  },
  {
    icon: Code,
    title: "Coding Profile Integration",
    description: "Link LeetCode, Codeforces, GitHub — see all your coding progress unified.",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    icon: Trophy,
    title: "Smart Leaderboards",
    description: "Compete on rankings by performance, improvement, and consistency — not just grades.",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Get predictive insights, weakness identification, and personalized study plans.",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    icon: Shield,
    title: "Mentor Dashboard",
    description: "Mentors track student health, identify at-risk students, and view batch analytics.",
    gradient: "from-cyan-500/20 to-blue-500/20",
  },
  {
    icon: Calendar,
    title: "Smart Calendar",
    description: "Contest alerts, assignment deadlines, exam schedules — never miss what matters.",
    gradient: "from-rose-500/20 to-red-500/20",
  },
  {
    icon: GraduationCap,
    title: "Attendance Tracker",
    description: "Know your eligibility status. Predict how many classes you can safely miss.",
    gradient: "from-indigo-500/20 to-violet-500/20",
  },
  {
    icon: Target,
    title: "Career Readiness",
    description: "Skill gap analysis, placement scores, and personalized certification paths.",
    gradient: "from-teal-500/20 to-emerald-500/20",
  },
];

const stats = [
  { value: "2,500+", label: "Students Active" },
  { value: "50+", label: "Mentors Onboard" },
  { value: "1M+", label: "Problems Tracked" },
  { value: "98%", label: "Satisfaction Rate" },
];

const testimonials = [
  {
    name: "Aarav Patel",
    role: "CSE, 3rd Year",
    text: "StuFolio helped me identify my weak subjects early. My CGPA went from 7.8 to 9.1 in two semesters!",
    avatar: "AP",
  },
  {
    name: "Dr. Meera Sharma",
    role: "Mentor, CS Department",
    text: "The mentor dashboard gives me a complete picture of my class. I can spot at-risk students before it's too late.",
    avatar: "MS",
  },
  {
    name: "Priya Reddy",
    role: "IT, 2nd Year",
    text: "The AI study planner and coding profile integration is incredible. It's like having a personal academic advisor.",
    avatar: "PR",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-sm font-extrabold text-white">S</span>
            </div>
            <span className="font-display text-xl font-bold text-foreground tracking-tight">StuFolio</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Stats</a>
            {isAuthenticated ? (
              <Link to={user?.role === "MENTOR" ? "/mentor" : "/dashboard"}>
                <Button size="sm" className="bg-gradient-primary text-white hover:opacity-90 shadow-glow px-6">
                  Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">Log in</Button>
                </Link>
                <Link to="/login">
                  <Button size="sm" className="bg-gradient-primary text-white hover:opacity-90 shadow-glow px-6">
                    Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
          {/* Mobile hamburger */}
          <button className="md:hidden text-muted-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <span className="text-xl font-bold">✕</span> : <span className="text-xl">☰</span>}
          </button>
        </div>
        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border/50 overflow-hidden"
            >
              <div className="flex flex-col gap-3 px-6 py-4">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
                <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Stats</a>
                {isAuthenticated ? (
                  <Link to={user?.role === "MENTOR" ? "/mentor" : "/dashboard"} onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full bg-gradient-primary text-white hover:opacity-90 shadow-glow">
                      Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full bg-gradient-primary text-white hover:opacity-90 shadow-glow">
                      Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-mesh" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[150px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-chart-3/8 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[100px] animate-pulse-glow" />

        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-5 py-2 mb-8 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">AI-Powered Student Intelligence Platform</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold leading-[0.92] tracking-tight mb-6">
              Your Campus
              <br />
              Growth,{" "}
              <span className="text-gradient-primary">Quantified.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              Unified academic & coding performance platform for your campus.
              <br className="hidden md:block" />
              Leaderboards, AI insights, mentor dashboards — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link to={user?.role === "MENTOR" ? "/mentor" : "/dashboard"}>
                  <Button size="lg" className="w-full sm:w-auto min-w-[220px] bg-gradient-primary text-white hover:opacity-90 shadow-glow-lg px-10 h-13 text-base font-semibold">
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button size="lg" className="w-full sm:w-auto min-w-[220px] bg-gradient-primary text-white hover:opacity-90 shadow-glow-lg px-10 h-13 text-base font-semibold">
                    Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link to="/leaderboard">
                <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[220px] h-13 text-base border-border/60 text-foreground hover:bg-secondary/80 px-8">
                  <Trophy className="mr-2 h-4 w-4 text-warning" /> View Leaderboard
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Floating cards preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
          >
            {[
              { label: "Performance Index", value: "82.4", change: "+5.2%", color: "text-primary" },
              { label: "Problems Solved", value: "347", change: "+28 this week", color: "text-accent" },
              { label: "Class Rank", value: "#4", change: "↑ 2 positions", color: "text-warning" },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.15 }}
                className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 text-left"
              >
                <p className="text-[11px] text-muted-foreground mb-1">{card.label}</p>
                <p className={`text-2xl font-display font-bold ${card.color}`}>{card.value}</p>
                <p className="text-[11px] text-accent mt-1">{card.change}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 mb-6">
              <Zap className="h-3 w-3 text-warning" />
              <span className="text-xs font-medium text-muted-foreground">Packed with Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Everything you need to <span className="text-gradient-accent">level up</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              One platform for academics, coding, and campus growth.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group relative rounded-2xl border border-border bg-card p-6 card-hover"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient}`}>
                  <feature.icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Get started in <span className="text-gradient-warm">3 steps</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Sign Up", desc: "Create your account with your college email. Choose student or mentor role.", icon: Users },
              { step: "02", title: "Link Profiles", desc: "Connect LeetCode, Codeforces, GitHub — your coding journey, unified.", icon: Code },
              { step: "03", title: "Track & Grow", desc: "Get AI insights, compete on leaderboards, and watch your growth skyrocket.", icon: Sparkles },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary mb-6 shadow-glow">
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 md:left-1/2 md:-translate-x-1/2 md:-top-3 text-6xl font-display font-extrabold text-border/30 select-none">
                  {item.step}
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="rounded-2xl border border-border bg-gradient-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 dot-pattern opacity-30" />
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-display font-extrabold text-gradient-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Loved by <span className="text-gradient-primary">students & mentors</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="relative rounded-3xl border border-border bg-gradient-card p-12 md:p-20 text-center overflow-hidden">
            <div className="absolute inset-0 grid-pattern opacity-15" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[150px] rounded-full" />
            <div className="relative z-10">
              <CheckCircle className="h-12 w-12 text-accent mx-auto mb-6" />
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
                Ready to track your <span className="text-gradient-primary">growth</span>?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg">
                Join your campus community and start climbing the leaderboard today. It's free to get started.
              </p>
              <Link to={isAuthenticated ? (user?.role === "MENTOR" ? "/mentor" : "/dashboard") : "/login"}>
                <Button size="lg" className="w-full sm:w-auto min-w-[220px] bg-gradient-primary text-white hover:opacity-90 shadow-glow-lg px-12 h-13 text-base font-semibold">
                  {isAuthenticated ? "Go to Dashboard" : "Start Now"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-xs font-extrabold text-white">S</span>
              </div>
              <span className="font-display text-lg font-bold text-foreground">StuFolio</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
              <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
            </div>
            <span className="text-sm text-muted-foreground">© 2026 StuFolio. Built for campus.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
