import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Shield,
    Lock,
    User,
    Key,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Eye,
    EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast } from "sonner";

interface AcademicSyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AcademicSyncModal = ({ isOpen, onClose, onSuccess }: AcademicSyncModalProps) => {
    const [step, setStep] = useState<"credentials" | "syncing" | "success">("credentials");
    const [loading, setLoading] = useState(false);
    const [captchaData, setCaptchaData] = useState<{ syncId: string; captchaBase64: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    
    // Form state
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [captcha, setCaptcha] = useState("");
    const [error, setError] = useState("");
    const [syncProgress, setSyncProgress] = useState("Initializing browser...");

    const fetchCaptcha = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await api.getSyncPortalCaptcha();
            setCaptchaData(data);
        } catch (err: any) {
            console.error("Captcha fetch error:", err);
            setError(err.message || "Could not connect to GGSIPU portal. Please check your internet connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setStep("credentials");
            setUsername("");
            setPassword("");
            setCaptcha("");
            setError("");
            fetchCaptcha();
        }
    }, [isOpen]);

    const handleSync = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password || !captcha || !captchaData) return;

        setStep("syncing");
        setSyncProgress("Logging into GGSIPU portal...");
        
        try {
            // Simulate progress steps
            setTimeout(() => setSyncProgress("Accessing examination records..."), 3000);
            setTimeout(() => setSyncProgress("Scraping semester results..."), 8000);
            setTimeout(() => setSyncProgress("Calculated CGPA & Trends..."), 15000);
            setTimeout(() => setSyncProgress("Finalizing dashboard update..."), 22000);

            await api.syncPortal({
                syncId: captchaData.syncId,
                username,
                password,
                captcha
            });

            setStep("success");
            toast.success("Academic records synced successfully!");
        } catch (err: any) {
            console.error("Sync error:", err);
            setError(err.message || "Sync failed. Please check your credentials and captcha.");
            setStep("credentials");
            fetchCaptcha(); // Refresh captcha on failure
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="relative bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border bg-secondary/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <RefreshCw className={step === "syncing" ? "h-5 w-5 text-primary animate-spin" : "h-5 w-5 text-primary"} />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-foreground">Portal Sync</h3>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Powered by GGSIPU</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>

                    <div className="p-6">
                        {step === "credentials" && (
                            <form onSubmit={handleSync} className="space-y-4">
                                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex gap-3 mb-6">
                                    <Shield className="h-5 w-5 text-blue-400 shrink-0" />
                                    <p className="text-[10px] leading-relaxed text-blue-400 font-medium">
                                        We use enterprise-grade encryption for local testing. Your GGSIPU credentials are never stored on our servers and are used only for this sync.
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-center gap-2 text-xs text-destructive font-medium mb-4">
                                        <AlertCircle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Portal Username</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                autoFocus
                                                placeholder="Roll No. or ID"
                                                className="pl-10 h-11 bg-secondary/30"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Portal Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="pl-10 pr-10 h-11 bg-secondary/30"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <button 
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Solve Captcha</label>
                                        <div className="flex gap-4 items-end">
                                            <div className="flex-1">
                                                <div className="relative">
                                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        placeholder="Code"
                                                        className="pl-10 h-11 bg-secondary/30 text-center font-mono font-bold tracking-widest"
                                                        value={captcha}
                                                        onChange={(e) => setCaptcha(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="w-32 h-11 bg-secondary/50 rounded-xl border border-border flex items-center justify-center overflow-hidden relative group">
                                                {loading ? (
                                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                ) : captchaData ? (
                                                    <img src={captchaData.captchaBase64} alt="Captcha" className="h-full w-full object-contain" />
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground">Error</span>
                                                )}
                                                <button 
                                                    type="button" 
                                                    onClick={fetchCaptcha}
                                                    disabled={loading}
                                                    className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                >
                                                    <RefreshCw className="h-4 w-4 text-primary" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-glow mt-6"
                                    disabled={loading || !captchaData}
                                >
                                    Start Secure Sync
                                </Button>
                            </form>
                        )}

                        {step === "syncing" && (
                            <div className="py-12 flex flex-col items-center text-center">
                                <div className="relative mb-8">
                                    <div className="h-24 w-24 rounded-full border-4 border-primary/20 flex items-center justify-center">
                                        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
                                    </div>
                                    <motion.div 
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-blue-500 shadow-glow flex items-center justify-center"
                                    >
                                        <Shield className="h-4 w-4 text-white" />
                                    </motion.div>
                                </div>
                                <h4 className="text-xl font-display font-bold text-foreground mb-2">Syncing in Progress</h4>
                                <p className="text-sm text-muted-foreground">{syncProgress}</p>
                                <div className="mt-8 w-full h-1.5 bg-secondary rounded-full overflow-hidden max-w-[200px]">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 20 }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                            </div>
                        )}

                        {step === "success" && (
                            <div className="py-12 flex flex-col items-center text-center">
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="h-24 w-24 rounded-full bg-green-500/10 flex items-center justify-center mb-8"
                                >
                                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                                </motion.div>
                                <h4 className="text-xl font-display font-bold text-foreground mb-2">Sync Complete!</h4>
                                <p className="text-sm text-muted-foreground">Your academic records have been securely updated.</p>
                                
                                <Button 
                                    onClick={onSuccess} 
                                    className="mt-8 px-8 h-11 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg"
                                >
                                    Go to Dashboard
                                </Button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AcademicSyncModal;
