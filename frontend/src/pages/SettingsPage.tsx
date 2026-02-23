import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Lock,
    Bell,
    Shield,
    Check,
    Eye,
    EyeOff,
    Link2,
    Loader2,
    X,
    Pencil,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface CodingProfile {
    id: string | null;
    platform: string;
    handle: string;
    connected: boolean;
    verified?: boolean;
    lastSynced?: string;
    stats?: { label: string; value: string }[];
}

const platformIcons: Record<string, string> = {
    LeetCode: "LC",
    Codeforces: "CF",
    GitHub: "GH",
    CodeChef: "CC",
};

const platformColors: Record<string, string> = {
    LeetCode: "bg-amber-500/10 text-amber-500",
    Codeforces: "bg-blue-500/10 text-blue-500",
    GitHub: "bg-gray-500/10 text-gray-300",
    CodeChef: "bg-orange-500/10 text-orange-500",
};

const SettingsPage = () => {
    const { user } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [profiles, setProfiles] = useState<CodingProfile[]>([]);
    const [loadingProfiles, setLoadingProfiles] = useState(true);
    const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
    const [handleInput, setHandleInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
    const [vCode, setVCode] = useState("");

    const [notifications, setNotifications] = useState({
        attendance: true,
        performance: true,
        contests: true,
        deadlines: true,
        email: false,
    });
    const [privacy, setPrivacy] = useState({
        showProfile: true,
        showCoding: true,
        showAttendance: false,
    });

    // Profile state
    const [profileForm, setProfileForm] = useState({
        name: "",
        enrollment: "",
        branch: "",
        section: "",
        semester: "",
        year: "",
        cgpa: "",
    });
    const [savingProfile, setSavingProfile] = useState(false);

    const role = user?.role === "MENTOR" ? "mentor" : "student";

    // Fetch linked coding profiles and verification code
    useEffect(() => {
        if (role !== "student") {
            setLoadingProfiles(false);
            return;
        }
        const fetchData = async () => {
            try {
                const [profilesData, codeData, profileResult] = await Promise.all([
                    api.getCodingProfiles(),
                    api.getVerificationCode(),
                    api.getStudentProfile()
                ]);
                setProfiles(profilesData);
                setVCode(codeData.code);

                if (profileResult && profileResult.profile) {
                    const p = profileResult.profile;
                    setProfileForm({
                        name: p.name || "",
                        enrollment: p.enrollment || "",
                        branch: p.branch || "",
                        section: p.section || "",
                        semester: p.semester || "",
                        year: p.year || "",
                        cgpa: p.cgpa?.toString() || "",
                    });
                }
            } catch (err) {
                console.error("Failed to load settings data:", err);
            } finally {
                setLoadingProfiles(false);
            }
        };
        fetchData();
    }, [role]);

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setErrorMsg("");
        setTimeout(() => setSuccessMsg(""), 4000);
    };

    const showError = (msg: string) => {
        setErrorMsg(msg);
        setSuccessMsg("");
        setTimeout(() => setErrorMsg(""), 6000);
    };

    const handleLink = async (platform: string) => {
        if (!handleInput.trim()) return;
        setSaving(true);
        setErrorMsg("");
        try {
            const result = await api.linkCodingProfile(platform, handleInput.trim());
            setProfiles((prev) =>
                prev.map((p) =>
                    p.platform === platform
                        ? { ...p, id: result.id, handle: result.handle, connected: true, stats: result.stats }
                        : p
                )
            );
            setEditingPlatform(null);
            setHandleInput("");
            setExpandedPlatform(platform);
            showSuccess(`✓ ${platform} profile verified and linked!`);
        } catch (err: any) {
            showError(err.message || `Failed to link ${platform} profile.`);
        } finally {
            setSaving(false);
        }
    };

    const handleUnlink = async (profile: CodingProfile) => {
        if (!profile.id) return;
        setSaving(true);
        try {
            await api.unlinkCodingProfile(profile.id);
            setProfiles((prev) =>
                prev.map((p) =>
                    p.platform === profile.platform
                        ? { ...p, id: null, handle: "", connected: false, stats: undefined }
                        : p
                )
            );
            showSuccess(`${profile.platform} unlinked.`);
        } catch (err: any) {
            showError(err.message || "Failed to unlink profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleRefreshAll = async () => {
        setRefreshing(true);
        try {
            const result = await api.refreshCodingProfiles();
            // Update local state with refreshed stats
            if (result.profiles) {
                setProfiles((prev) =>
                    prev.map((p) => {
                        const refreshed = result.profiles.find((r: any) => r.platform === p.platform);
                        return refreshed ? { ...p, stats: refreshed.stats } : p;
                    })
                );
            }
            showSuccess(`Stats refreshed for ${result.refreshed} profile(s)!`);
        } catch (err: any) {
            showError(err.message || "Failed to refresh stats.");
        } finally {
            setRefreshing(false);
        }
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            await api.updateStudentProfile(profileForm);
            showSuccess("Profile information updated successfully!");
            // Optional: refresh page or update auth context if needed
        } catch (err: any) {
            showError(err.message || "Failed to update profile.");
        } finally {
            setSavingProfile(false);
        }
    };

    const startEditing = (platform: string, currentHandle: string) => {
        setEditingPlatform(platform);
        setHandleInput(currentHandle);
        setErrorMsg("");
    };

    const cancelEditing = () => {
        setEditingPlatform(null);
        setHandleInput("");
        setErrorMsg("");
    };

    const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-secondary"}`}
        >
            <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
        </button>
    );

    const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U";
    const connectedCount = profiles.filter((p) => p.connected).length;

    return (
        <DashboardLayout title="Settings" subtitle="Manage your account & preferences" role={role}>
            <div className="max-w-3xl space-y-6">

                {/* Messages */}
                <AnimatePresence>
                    {successMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm"
                        >
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                            {successMsg}
                        </motion.div>
                    )}
                    {errorMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                        >
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {errorMsg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Profile */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <User className="h-5 w-5 text-primary" />
                        <h3 className="font-display font-semibold text-foreground">Profile Information</h3>
                    </div>
                    <div className="flex items-center gap-4 mb-5">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-xl font-bold text-white shadow-glow">
                            {initials}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">{profileForm.name || user?.name || "User"}</p>
                            <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                            <Input
                                value={profileForm.name}
                                onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Enrollment Number</label>
                            <Input
                                value={profileForm.enrollment}
                                onChange={(e) => setProfileForm(p => ({ ...p, enrollment: e.target.value }))}
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Branch</label>
                            <Input
                                value={profileForm.branch}
                                onChange={(e) => setProfileForm(p => ({ ...p, branch: e.target.value }))}
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Section</label>
                            <Input
                                value={profileForm.section}
                                onChange={(e) => setProfileForm(p => ({ ...p, section: e.target.value }))}
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Semester</label>
                            <Input
                                value={profileForm.semester}
                                onChange={(e) => setProfileForm(p => ({ ...p, semester: e.target.value }))}
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Academic Year</label>
                            <Input
                                value={profileForm.year}
                                onChange={(e) => setProfileForm(p => ({ ...p, year: e.target.value }))}
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Current CGPA</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={profileForm.cgpa}
                                onChange={(e) => setProfileForm(p => ({ ...p, cgpa: e.target.value }))}
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="mt-6 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                        {savingProfile ? "Saving..." : "Save Changes"}
                    </button>
                </motion.div>

                {/* Linked Accounts — Only for students */}
                {role === "student" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-xl border border-border bg-card p-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Link2 className="h-5 w-5 text-primary" />
                                <h3 className="font-display font-semibold text-foreground">Linked Coding Profiles</h3>
                            </div>
                            {connectedCount > 0 && (
                                <button
                                    onClick={handleRefreshAll}
                                    disabled={refreshing}
                                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                                    {refreshing ? "Refreshing..." : "Refresh All Stats"}
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">
                            Connect your coding platform accounts. We'll verify the username exists and fetch your real stats.
                        </p>

                        {loadingProfiles ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {profiles.map((profile) => (
                                    <div key={profile.platform} className="rounded-lg bg-secondary/30 border border-border overflow-hidden">
                                        {/* Header row */}
                                        <div className="flex items-center justify-between p-3">
                                            <div
                                                className="flex items-center gap-3 cursor-pointer flex-1"
                                                onClick={() => {
                                                    if (profile.connected) {
                                                        setExpandedPlatform(expandedPlatform === profile.platform ? null : profile.platform);
                                                    }
                                                }}
                                            >
                                                <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold ${platformColors[profile.platform] || (profile.connected ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")
                                                    }`}>
                                                    {platformIcons[profile.platform] || profile.platform.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-sm font-medium text-foreground">{profile.platform}</p>
                                                        {profile.verified && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                                                                <CheckCircle2 className="h-3 w-3 text-accent" />
                                                                <span className="text-[10px] font-bold text-accent uppercase tracking-tighter">Verified</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {profile.connected ? profile.handle : "Not connected"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {profile.connected ? (
                                                    <>
                                                        <button
                                                            onClick={() => startEditing(profile.platform, profile.handle)}
                                                            className="text-xs font-medium px-2.5 py-1.5 rounded-lg border bg-secondary/50 text-muted-foreground border-border hover:bg-secondary transition-all"
                                                            disabled={saving}
                                                            title="Edit handle"
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleUnlink(profile)}
                                                            className="text-xs font-medium px-2.5 py-1.5 rounded-lg border bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 transition-all"
                                                            disabled={saving}
                                                        >
                                                            Disconnect
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => startEditing(profile.platform, "")}
                                                        className="text-xs font-medium px-3 py-1.5 rounded-lg border bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-all"
                                                    >
                                                        Connect
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Inline edit form */}
                                        <AnimatePresence>
                                            {editingPlatform === profile.platform && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-border overflow-hidden"
                                                >
                                                    <div className="p-4 bg-secondary/10 space-y-4">
                                                        {/* Verification Guide */}
                                                        {!profile.connected && (
                                                            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 mb-2">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Shield className="h-3.5 w-3.5 text-primary" />
                                                                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">Ownership Verification</p>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                                                                    To verify this account is yours, please copy the code below and paste it into your <strong>{profile.platform === 'Codeforces' ? 'First Name' : (profile.platform === 'CodeChef' ? 'Name' : (profile.platform === 'LeetCode' ? 'About Me' : 'Bio'))}</strong> section on {profile.platform}.
                                                                </p>
                                                                <div className="flex items-center justify-between gap-2 p-2 rounded bg-background border border-border group">
                                                                    <code className="text-sm font-mono font-bold text-accent select-all">{vCode || "LOADING..."}</code>
                                                                    <button
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(vCode);
                                                                            showSuccess("Code copied to clipboard!");
                                                                        }}
                                                                        className="text-[10px] font-medium uppercase text-muted-foreground hover:text-primary transition-colors"
                                                                    >
                                                                        Copy Code
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <label className="text-xs text-muted-foreground mb-1.5 block">
                                                                Enter your {profile.platform} username
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    placeholder={`e.g. your_${profile.platform.toLowerCase()}_username`}
                                                                    value={handleInput}
                                                                    onChange={(e) => setHandleInput(e.target.value)}
                                                                    className="bg-secondary/50 border-border text-sm flex-1"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") handleLink(profile.platform);
                                                                        if (e.key === "Escape") cancelEditing();
                                                                    }}
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={() => handleLink(profile.platform)}
                                                                    disabled={saving || !handleInput.trim()}
                                                                    className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 min-w-[100px] justify-center"
                                                                >
                                                                    {saving ? (
                                                                        <>
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                            Verifying...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Check className="h-3 w-3" />
                                                                            {profile.connected ? "Update" : "Verify & Link"}
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={cancelEditing}
                                                                    className="px-2 py-2 rounded-lg border border-border text-muted-foreground hover:bg-secondary/50 transition-colors"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Stats display */}
                                        <AnimatePresence>
                                            {profile.connected && expandedPlatform === profile.platform && profile.stats && profile.stats.length > 0 && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-border overflow-hidden"
                                                >
                                                    <div className="p-3 bg-secondary/5">
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                            {profile.stats.map((stat, i) => (
                                                                <div key={i} className="rounded-lg bg-secondary/30 p-2">
                                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                                                    <p className="text-sm font-semibold text-foreground">{stat.value}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Notifications */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <Bell className="h-5 w-5 text-primary" />
                        <h3 className="font-display font-semibold text-foreground">Notifications</h3>
                    </div>
                    <div className="space-y-4">
                        {[
                            { key: "attendance", label: "Attendance Alerts", desc: "Get notified when attendance drops below threshold" },
                            { key: "performance", label: "Performance Updates", desc: "Weekly performance summaries and insights" },
                            { key: "contests", label: "Contest Reminders", desc: "Upcoming coding contest notifications" },
                            { key: "deadlines", label: "Deadline Alerts", desc: "Assignment and exam deadline reminders" },
                            { key: "email", label: "Email Notifications", desc: "Receive important updates via email" },
                        ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                </div>
                                <ToggleSwitch
                                    checked={notifications[item.key as keyof typeof notifications]}
                                    onChange={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                                />
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Privacy */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <Shield className="h-5 w-5 text-primary" />
                        <h3 className="font-display font-semibold text-foreground">Privacy & Visibility</h3>
                    </div>
                    <div className="space-y-4">
                        {[
                            { key: "showProfile", label: "Show Profile on Leaderboard", desc: "Allow others to see your name on the leaderboard" },
                            { key: "showCoding", label: "Show Coding Profiles", desc: "Display linked coding platform stats publicly" },
                            { key: "showAttendance", label: "Show Attendance", desc: "Allow attendance data to be visible to peers" },
                        ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                </div>
                                <ToggleSwitch
                                    checked={privacy[item.key as keyof typeof privacy]}
                                    onChange={() => setPrivacy((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                                />
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Security */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <Lock className="h-5 w-5 text-primary" />
                        <h3 className="font-display font-semibold text-foreground">Security</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Current Password</label>
                            <div className="relative">
                                <Input type={showPassword ? "text" : "password"} defaultValue="••••••••" className="bg-secondary/50 border-border pr-10" />
                                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">New Password</label>
                            <Input type="password" placeholder="Enter new password" className="bg-secondary/50 border-border" />
                        </div>
                    </div>
                    <button className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                        Update Password
                    </button>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default SettingsPage;
