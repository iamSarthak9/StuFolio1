import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Mail } from "lucide-react";
import api from "@/lib/api";

interface EmailAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
}

const PREDEFINED_SUBJECTS = [
    "Attendance Warning",
    "Academic Performance Review",
    "Missing Assignments",
    "Meeting Request"
];

const PREDEFINED_MESSAGES: Record<string, string> = {
    "Attendance Warning": "Your attendance has dropped below the required threshold. Please meet with me immediately to discuss your situation.",
    "Academic Performance Review": "I would like to review your recent academic performance. Please schedule a time to meet with me this week.",
    "Missing Assignments": "You have several missing assignments that are affecting your grade. Please submit them as soon as possible.",
    "Meeting Request": "Please schedule a brief meeting with me sometime this week to discuss your progress."
};

const EmailAlertModal = ({ isOpen, onClose, studentId, studentName }: EmailAlertModalProps) => {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubjectChange = (val: string) => {
        setSubject(val);
        if (PREDEFINED_MESSAGES[val]) {
            setMessage(PREDEFINED_MESSAGES[val]);
        }
    };

    const handleSend = async () => {
        if (!subject || !message) {
            setError("Subject and message are required.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            await api.sendMentorAlert(studentId, subject, message);
            setSuccess(true);
            setTimeout(() => {
                onClose();
                // Reset state after close animation
                setTimeout(() => {
                    setSuccess(false);
                    setSubject("");
                    setMessage("");
                }, 300);
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to send alert. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-muted/40">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-display font-semibold text-foreground leading-tight">Send Email Alert</h2>
                                <p className="text-sm text-muted-foreground">To: {studentName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                            disabled={loading || success}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6 space-y-4">
                        {success ? (
                            <div className="py-8 text-center space-y-3">
                                <div className="h-16 w-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Send className="h-8 w-8 ml-1" />
                                </div>
                                <h3 className="text-xl font-display font-bold text-foreground">Alert Sent!</h3>
                                <p className="text-muted-foreground">An email has been successfully sent to {studentName}.</p>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Subject</label>
                                    <select
                                        value={PREDEFINED_SUBJECTS.includes(subject) ? subject : ""}
                                        onChange={(e) => handleSubjectChange(e.target.value)}
                                        className="w-full p-2.5 text-sm bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    >
                                        <option value="" disabled>Select a predefined subject...</option>
                                        {PREDEFINED_SUBJECTS.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Or type a custom subject..."
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full mt-2 p-2.5 text-sm bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Message</label>
                                    <textarea
                                        rows={5}
                                        placeholder="Type your message here..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full p-3 text-sm bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        This alert will be sent directly to the student's college email address and logged in their notifications.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {!success && (
                        <div className="p-4 sm:p-6 border-t border-border bg-muted/40 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-foreground bg-background hover:bg-secondary border border-border rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={loading || !subject || !message}
                                className="px-5 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Send Alert
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EmailAlertModal;
