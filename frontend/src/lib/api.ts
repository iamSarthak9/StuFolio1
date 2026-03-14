const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    studentId?: string;
    mentorId?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface CodingProfile {
    id: string;
    platform: string;
    handle: string;
    stats: { label: string; value: string }[];
    activityData?: Record<string, number>;
    connected?: boolean;
    verified?: boolean;
    lastSynced?: string | Date;
}

export interface Profile {
    name: string;
    enrollment: string;
    email: string;
    section: string;
    semester: string;
    branch: string;
    year: string;
    cgpa: number;
    rank?: number | null;
}

export interface StudentProfileResponse {
    profile: Profile;
    semesterCGPAs: { sem: string; cgpa: number }[];
    codingProfiles: CodingProfile[];
    badges: { label: string; icon: string; desc: string }[];
    skills: string[];
}

export interface Event {
    id: string;
    title: string;
    date: string | Date;
    type: "contest" | "deadline" | "event" | string;
    description?: string;
    location?: string;
}

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
            if (response.status === 401 && !path.includes("/auth/login") && !path.includes("/auth/me")) {
                console.warn(`🔒 Unauthorized access to ${path}, cleaning up...`);
                this.logout();
                window.location.href = "/login";
            }
            const errorData = await response.json().catch(() => ({}));
            console.error(`❌ API Error (${response.status}) at ${path}:`, errorData);
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        return response.json();
    }

    // Auth
    async login(email: string, password: string) {
        const data = await this.request<AuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        this.setToken(data.token);
        return data;
    }

    async msalLogin(idToken: string) {
        const data = await this.request<AuthResponse>("/auth/msal", {
            method: "POST",
            body: JSON.stringify({ idToken }),
        });
        this.setToken(data.token);
        return data;
    }

    async register(userData: Record<string, unknown>) {
        const data = await this.request<AuthResponse>("/auth/register", {
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
                user: User;
            }>("/auth/me");
            return data.user;
        } catch (err: unknown) {
            // Only log out if the server explicitly says the token is invalid (401)
            // If it's a network error (e.g. status 500 or fetch failed), we preserve the token
            if (err instanceof Error && (err.message?.includes("401") || (err as { status?: number }).status === 401)) {
                this.logout();
            }
            return null;
        }
    }

    logout() {
        this.setToken(null);
        localStorage.removeItem("stufolio_user");
    }

    // Student
    getStudentDashboard() {
        return this.request<unknown>("/students/me");
    }

    getStudentProfile() {
        return this.request<StudentProfileResponse>("/students/me/profile");
    }

    getStudentAttendance() {
        return this.request<unknown>("/students/me/attendance");
    }

    getStudentAcademics() {
        return this.request<unknown>("/students/me/academics");
    }

    // Coding Profiles
    getCodingProfiles() {
        return this.request<CodingProfile[]>("/students/me/coding-profiles");
    }

    linkCodingProfile(platform: string, handle: string) {
        return this.request<CodingProfile>("/students/me/coding-profiles", {
            method: "POST",
            body: JSON.stringify({ platform, handle }),
        });
    }

    unlinkCodingProfile(id: string) {
        return this.request<unknown>(`/students/me/coding-profiles/${id}`, {
            method: "DELETE",
        });
    }

    refreshCodingProfiles() {
        return this.request<{ profiles: CodingProfile[]; refreshed: number }>("/students/me/coding-profiles/refresh", {
            method: "POST",
        });
    }

    getVerificationCode() {
        return this.request<{ code: string }>("/students/me/verification-code");
    }

    getAIAnalysis() {
        return this.request<unknown>("/analysis/me");
    }

    updateStudentProfile(data: unknown) {
        return this.request<unknown>("/students/me", {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    }

    // Mentor
    getMentorDashboard() {
        return this.request<unknown>("/mentor/dashboard");
    }

    getMentorStudents(params?: { section?: string; semester?: string; search?: string }) {
        const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
        return this.request<unknown>(`/mentor/students${query}`);
    }

    getMentorStudentDetail(studentId: string) {
        return this.request<unknown>(`/students/${studentId}`);
    }

    sendMentorAlert(studentId: string, subject: string, message: string) {
        return this.request<{ success: boolean; message: string }>(`/mentor/students/${studentId}/alert`, {
            method: "POST",
            body: JSON.stringify({ subject, message }),
        });
    }

    getMentorAnalytics() {
        return this.request<unknown>("/mentor/analytics");
    }

    getMentorSubjects() {
        return this.request<{ id: string; name: string; code: string; semester: string }[]>("/mentor/subjects");
    }

    submitDailyAttendance(subjectId: string, date: string, records: { studentId: string; status: string }[]) {
        return this.request<unknown>("/mentor/attendance/daily", {
            method: "POST",
            body: JSON.stringify({ subjectId, date, records }),
        });
    }

    updateStudentAcademics(studentId: string, data: { subjectId: string; marks: number; semester: string }) {
        return this.request<unknown>(`/mentor/students/${studentId}/academics`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    }

    getMentorProfile() {
        return this.request<{
            profile: {
                id: string;
                name: string;
                email: string;
                teacherId: string | null;
                department: string;
                designation: string;
                section: string;
            }
        }>("/mentor/profile");
    }

    updateMentorProfile(data: {
        name?: string;
        teacherId?: string;
        department?: string;
        designation?: string;
        section?: string;
    }) {
        return this.request<{
            profile: {
                id: string;
                name: string;
                email: string;
                teacherId: string | null;
                department: string;
                designation: string;
                section: string;
            }
        }>("/mentor/profile", {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    }

    getAttendanceForDay(date: string) {
        return this.request<{
            students: { id: string; name: string; enrollment: string }[];
            subjects: { id: string; name: string; code: string; semester: string }[];
            records: { studentId: string; subjectId: string; status: string }[];
        }>(`/mentor/attendance/day?date=${date}`);
    }

    submitAttendanceForDay(date: string, records: { studentId: string; subjectId: string; status: string }[]) {
        return this.request<{ success: boolean }>("/mentor/attendance/day", {
            method: "POST",
            body: JSON.stringify({ date, records }),
        });
    }

    // Leaderboard
    getLeaderboard(tab = "overall") {
        return this.request<unknown>(`/leaderboard?tab=${tab}`);
    }

    // Events
    getEvents(month?: number, year?: number) {
        const params = month && year ? `?month=${month}&year=${year}` : "";
        return this.request<Event[]>(`/events${params}`);
    }

    // Notifications
    getNotifications() {
        return this.request<unknown>("/notifications");
    }

    markNotificationRead(id: string) {
        return this.request<unknown>(`/notifications/${id}/read`, { method: "PATCH" });
    }

    markAllNotificationsRead() {
        return this.request<unknown>("/notifications/read-all", { method: "PATCH" });
    }
}

export const api = new ApiClient();
export default api;
