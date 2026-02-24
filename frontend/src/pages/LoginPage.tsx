import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, GraduationCap, Users, Shield, Sparkles, Code, BarChart3, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"student" | "mentor">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "MENTOR" ? "/mentor" : "/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          name,
          role: role === "student" ? "STUDENT" : "MENTOR",
          enrollment: role === "student" ? enrollment : undefined,
        });
      }

      if (role === "mentor") {
        navigate("/mentor");
      } else {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Authentication failed. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute inset-0 bg-gradient-mesh" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-chart-3/8 blur-[100px] animate-pulse-glow" />

        <div className="relative z-10 p-12 max-w-lg">
          <Link to="/" className="flex items-center gap-2.5 mb-16">
            <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-base font-extrabold text-white">S</span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground tracking-tight">StuFolio</span>
          </Link>

          <h2 className="text-4xl font-display font-bold mb-4 text-foreground leading-tight">
            Your campus growth,
            <br />
            <span className="text-gradient-primary">quantified.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-12">
            Track academic + coding performance. Compete on leaderboards. Get AI-powered insights.
          </p>

          <div className="space-y-4">
            {[
              { icon: BarChart3, text: "Real-time academic & coding dashboards" },
              { icon: Sparkles, text: "AI-powered performance predictions" },
              { icon: Code, text: "LeetCode, Codeforces, GitHub integration" },
              { icon: Shield, text: "Privacy-safe ranking system" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <span className="text-sm font-extrabold text-white">S</span>
              </div>
              <span className="font-display text-xl font-bold text-foreground tracking-tight">StuFolio</span>
            </Link>
          </div>

          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {isLogin ? "Sign in to your StuFolio account" : "Join your campus community"}
          </p>

          {/* Role selector */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setRole("student")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-medium transition-all ${role === "student"
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border text-muted-foreground hover:border-primary/30 hover:bg-secondary/50"
                }`}
            >
              <GraduationCap className="h-4 w-4" />
              Student
            </button>
            <button
              onClick={() => setRole("mentor")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-medium transition-all ${role === "mentor"
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border text-muted-foreground hover:border-primary/30 hover:bg-secondary/50"
                }`}
            >
              <Users className="h-4 w-4" />
              Mentor
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Full Name</Label>
                <Input
                  placeholder="Nakul Gupta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-secondary/50 border-border text-foreground h-11 rounded-xl"
                />
              </div>
            )}

            {!isLogin && role === "student" && (
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Enrollment Number</Label>
                <Input
                  placeholder="BTCS22-001"
                  value={enrollment}
                  onChange={(e) => setEnrollment(e.target.value)}
                  className="bg-secondary/50 border-border text-foreground h-11 rounded-xl"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-foreground text-sm">
                {role === "student" ? "College Email" : "Faculty Email"}
              </Label>
              <Input
                type="email"
                placeholder={role === "student" ? "you@campus.edu" : "faculty@campus.edu"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-secondary/50 border-border text-foreground h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground text-sm">Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-secondary/50 border-border text-foreground h-11 rounded-xl"
              />
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-primary text-white hover:opacity-90 shadow-glow h-11 mt-2 rounded-xl text-sm font-semibold"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...</>
              ) : (
                <>{isLogin ? "Sign In" : "Create Account"} <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
