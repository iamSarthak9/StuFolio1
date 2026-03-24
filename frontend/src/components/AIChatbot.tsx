import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";
import api from "@/lib/api";

const quickActions = [
    "How do I check my attendance?",
    "Show me my AI analysis",
    "How to link my LeetCode profile?",
    "Where can I see the leaderboard?",
];

interface Message {
    id: number;
    text: string;
    sender: "user" | "bot";
}

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 0, text: "Hi! I'm StuBot your AI assistant for StuFolio. How can I help you today?", sender: "bot" },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;
        const userMsg: Message = { id: Date.now(), text, sender: "user" };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            console.log(`[Chat] Sending message to bot: ${text}`);
            const pageContextStr = sessionStorage.getItem('bot_page_context');
            const pageContext = pageContextStr ? JSON.parse(pageContextStr) : undefined;
            const result = await api.chatWithBot(text, pageContext);
            console.log("[Chat] Bot response received:", result);
            const botMsg: Message = { id: Date.now() + 1, text: result.response, sender: "bot" };
            setMessages((prev) => [...prev, botMsg]);
        } catch (error) {
            console.error("[Chat] Request failed:", error);
            const errorMsg: Message = { id: Date.now() + 1, text: "I'm having trouble connecting to my servers right now 😢", sender: "bot" };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl bg-background border-2 border-primary shadow-glow flex items-center justify-center text-primary hover:shadow-glow-lg transition-all"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-7 w-7"
                        >
                            <path d="M2 5V19C2 19 6 17 12 19V5C12 5 6 3 2 5Z" />
                            <path d="M22 5V19C22 19 18 17 12 19V5C12 5 18 3 22 5Z" />
                            <path d="M8 10.5L6.5 12L8 13.5" />
                            <path d="M16 10.5L17.5 12L16 13.5" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] rounded-2xl border border-border bg-card shadow-elevated flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-card">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-display font-semibold text-foreground text-sm">StuBot</h3>
                                    <div className="flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                                        <span className="text-[10px] text-accent">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === "user"
                                            ? "bg-gradient-primary text-white rounded-br-md"
                                            : "bg-secondary text-foreground rounded-bl-md"
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                                    <div className="max-w-[85%] rounded-2xl px-4 py-3.5 text-sm bg-secondary text-foreground rounded-bl-md flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        {messages.length <= 1 && (
                            <div className="px-4 pb-2">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Sparkles className="h-3 w-3 text-primary" />
                                    <span className="text-[10px] text-muted-foreground font-medium">Quick questions</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {quickActions.map((action) => (
                                        <button
                                            key={action}
                                            onClick={() => sendMessage(action)}
                                            className="text-[11px] px-2.5 py-1 rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                                        >
                                            {action}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-3 border-t border-border">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                                    placeholder="Ask me anything..."
                                    className="flex-1 h-10 rounded-xl border border-border bg-secondary/50 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                                />
                                <button
                                    onClick={() => sendMessage(input)}
                                    disabled={!input.trim()}
                                    className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white disabled:opacity-40 hover:shadow-glow transition-all"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIChatbot;
