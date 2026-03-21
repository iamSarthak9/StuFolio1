import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Trophy,
  User,
  Calendar,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Search,
  BarChart3,
  Users,
  AlertTriangle,
  BookOpen,
  Target,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";
import NotificationCenter from "./NotificationCenter";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import Logo from "./Logo";
import AIChatbot from "./AIChatbot";

const studentNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: User, label: "My Profile", path: "/profile" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: Brain, label: "AI Analysis", path: "/ai-analysis" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: BookOpen, label: "Attendance", path: "/attendance" },
  { icon: Target, label: "Career & Skills", path: "/career" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const mentorNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/mentor" },
  { icon: Users, label: "Students", path: "/mentor/students" },
  { icon: BookOpen, label: "Daily Attendance", path: "/mentor/attendance" },
  { icon: GraduationCap, label: "Academic Records", path: "/mentor/academics" },
  { icon: BarChart3, label: "Analytics", path: "/mentor/analytics" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  role?: "student" | "mentor";
}

const DashboardLayout = ({ children, title, subtitle, role = "student" }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = role === "mentor" ? mentorNavItems : studentNavItems;

  useEffect(() => {
    if (location.pathname === "/dashboard" || location.pathname === "/mentor") {
      const timer = setTimeout(() => {
        toast("Welcome to StuFolio!", {
          description: "Just a gentle heads-up: academic data and attendance data you currently see is dummy data for demonstration purposes.",
          duration: 6000,
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.2 }}
        className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r border-border bg-secondary/95 backdrop-blur-xl
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform lg:transition-none`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
          {!collapsed ? (
            <Logo
              size="md"
              showText={true}
              subtitle={role === "mentor" ? "Mentor Panel" : "Student Portal"}
              className="flex-1"
            />
          ) : (
            <Logo size="md" showText={false} className="mx-auto" />
          )}
          <button className="lg:hidden text-muted-foreground" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "nav-active-bar"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-border/50 space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-all"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main
        className={`flex-1 transition-all duration-200 min-h-screen overflow-x-hidden ${collapsed ? "lg:ml-[72px]" : "lg:ml-[256px]"
          } ml-0`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-muted-foreground" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-56 rounded-lg border border-border bg-secondary/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative h-9 w-9 rounded-lg flex items-center justify-center border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">3</span>
              </button>
              {showNotifications && (
                <NotificationCenter onClose={() => setShowNotifications(false)} />
              )}
            </div>

            {/* Avatar */}
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:shadow-glow transition-all">
              {role === "mentor" ? "DS" : "NG"}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">{children}</div>
      </main>

      {/* Persistent AI Chatbot */}
      {role === "student" && <AIChatbot />}
    </div>
  );
};

export default DashboardLayout;
