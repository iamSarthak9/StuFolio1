import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import AIAnalysis from "./pages/AIAnalysis";
import CalendarPage from "./pages/CalendarPage";
import AttendancePage from "./pages/AttendancePage";
import CareerPage from "./pages/CareerPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import MentorDashboard from "./pages/MentorDashboard";
import MentorStudentsPage from "./pages/MentorStudentsPage";
import MentorStudentDetail from "./pages/MentorStudentDetail";
import MentorAnalytics from "./pages/MentorAnalytics";
import MentorAttendancePage from "./pages/MentorAttendancePage";
import MentorAcademicRecordsPage from "./pages/MentorAcademicRecordsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="stufolio-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Student */}
              <Route path="/dashboard" element={<ProtectedRoute requiredRole="STUDENT"><StudentDashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute requiredRole="STUDENT"><StudentProfile /></ProtectedRoute>} />
              <Route path="/ai-analysis" element={<ProtectedRoute requiredRole="STUDENT"><AIAnalysis /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute requiredRole="STUDENT"><AttendancePage /></ProtectedRoute>} />
              <Route path="/career" element={<ProtectedRoute requiredRole="STUDENT"><CareerPage /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* Mentor */}
              <Route path="/mentor" element={<ProtectedRoute requiredRole="MENTOR"><MentorDashboard /></ProtectedRoute>} />
              <Route path="/mentor/students" element={<ProtectedRoute requiredRole="MENTOR"><MentorStudentsPage /></ProtectedRoute>} />
              <Route path="/mentor/student-detail" element={<ProtectedRoute requiredRole="MENTOR"><MentorStudentDetail /></ProtectedRoute>} />
              <Route path="/mentor/attendance" element={<ProtectedRoute requiredRole="MENTOR"><MentorAttendancePage /></ProtectedRoute>} />
              <Route path="/mentor/academics" element={<ProtectedRoute requiredRole="MENTOR"><MentorAcademicRecordsPage /></ProtectedRoute>} />
              <Route path="/mentor/analytics" element={<ProtectedRoute requiredRole="MENTOR"><MentorAnalytics /></ProtectedRoute>} />
              <Route path="/mentor/settings" element={<ProtectedRoute requiredRole="MENTOR"><SettingsPage /></ProtectedRoute>} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
