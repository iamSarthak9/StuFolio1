const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

class ApiClient {
    private token: string | null = null;

    constructor() {
        this.token = localStorage.getItem("stufolio_token");
    }

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem("stufolio_token", token);
        } else {
            localStorage.removeItem("stufolio_token");
        }
    }

    getToken() {
        return this.token;
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string>),
        };

        if (this.token) {
            headers["Authorization"] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            if (response.status === 401 && !path.includes("/auth/login")) {
                this.logout();
                window.location.href = "/login";
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        return response.json();
    }

    // Auth
    async login(email: string, password: string) {
        const data = await this.request<{
            token: string;
            user: { id: string; email: string; name: string; role: string; studentId?: string; mentorId?: string };
        }>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        this.setToken(data.token);
        return data;
    }

    async register(userData: Record<string, any>) {
        const data = await this.request<{
            token: string;
            user: { id: string; email: string; name: string; role: string; studentId?: string; mentorId?: string };
        }>("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData),
        });
        this.setToken(data.token);
        return data;
    }

    async verifySession() {
        if (!this.token) return null;
        try {
            const data = await this.request<{
                user: { id: string; email: string; name: string; role: string; studentId?: string; mentorId?: string };
            }>("/auth/me");
            return data.user;
        } catch (err) {
            this.logout();
            return null;
        }
    }

    logout() {
        this.setToken(null);
        localStorage.removeItem("stufolio_user");
    }

    // Student
    getStudentDashboard() {
        return this.request<any>("/students/me");
    }

    getStudentProfile() {
        return this.request<any>("/students/me/profile");
    }

    getStudentAttendance() {
        return this.request<any>("/students/me/attendance");
    }

    getStudentAcademics() {
        return this.request<any>("/students/me/academics");
    }

    // Coding Profiles
    getCodingProfiles() {
        return this.request<any[]>("/students/me/coding-profiles");
    }

    linkCodingProfile(platform: string, handle: string) {
        return this.request<any>("/students/me/coding-profiles", {
            method: "POST",
            body: JSON.stringify({ platform, handle }),
        });
    }

    unlinkCodingProfile(id: string) {
        return this.request<any>(`/students/me/coding-profiles/${id}`, {
            method: "DELETE",
        });
    }

    refreshCodingProfiles() {
        return this.request<any>("/students/me/coding-profiles/refresh", {
            method: "POST",
        });
    }

    getVerificationCode() {
        return this.request<{ code: string }>("/students/me/verification-code");
    }

    getAIAnalysis() {
        return this.request<any>("/analysis/me");
    }

    // Mentor
    getMentorDashboard() {
        return this.request<any>("/mentor/dashboard");
    }

    getMentorStudents(params?: { section?: string; semester?: string; search?: string }) {
        const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
        return this.request<any>(`/mentor/students${query}`);
    }

    getMentorStudentDetail(studentId: string) {
        return this.request<any>(`/students/${studentId}`);
    }

    getMentorAnalytics() {
        return this.request<any>("/mentor/analytics");
    }

    // Leaderboard
    getLeaderboard(tab = "overall") {
        return this.request<any>(`/leaderboard?tab=${tab}`);
    }

    // Events
    getEvents(month?: number, year?: number) {
        const params = month && year ? `?month=${month}&year=${year}` : "";
        return this.request<any>(`/events${params}`);
    }

    // Notifications
    getNotifications() {
        return this.request<any>("/notifications");
    }

    markNotificationRead(id: string) {
        return this.request<any>(`/notifications/${id}/read`, { method: "PATCH" });
    }

    markAllNotificationsRead() {
        return this.request<any>("/notifications/read-all", { method: "PATCH" });
    }
}

export const api = new ApiClient();
export default api;
