import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Clock, Calendar, Timer, MapPin } from "lucide-react";
import PlatformIcon from "./PlatformIcon";
import { cn } from "@/lib/utils";

interface ContestModalProps {
    isOpen: boolean;
    onClose: () => void;
    contest: {
        title: string;
        date: string | Date;
        platform?: string;
        link?: string;
        duration?: string;
        description?: string;
        type?: string;
    } | null;
}

const CountdownBanner = ({ targetDate }: { targetDate: string | Date }) => {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        const calculate = () => {
            const diff = new Date(targetDate).getTime() - new Date().getTime();
            if (diff <= 0) return "LIVE NOW";
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);
            
            if (days > 0) return `${days}d ${hours}h ${mins}m`;
            return `${hours}h ${mins}m ${secs}s`;
        };

        const timer = setInterval(() => setTimeLeft(calculate()), 1000);
        setTimeLeft(calculate());
        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className="bg-[#FACC15] p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-black/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-black" />
                </div>
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/60">Contest starts in</p>
                    <p className="font-mono font-black text-2xl text-black tabular-nums">{timeLeft}</p>
                </div>
            </div>
            <div className="hidden sm:block">
                <div className="px-3 py-1 bg-black text-[#FACC15] text-[10px] font-black rounded-full uppercase tracking-widest">
                    Upcoming
                </div>
            </div>
        </div>
    );
};

const ContestModal: React.FC<ContestModalProps> = ({ isOpen, onClose, contest }) => {
    if (!contest) return null;

    const dateObj = new Date(contest.date);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="relative w-full max-w-lg bg-[#0A0A0A] border border-[#27272A] rounded-2xl shadow-3xl overflow-hidden"
                    >
                        {/* Countdown Banner */}
                        <CountdownBanner targetDate={contest.date} />

                        {/* Content */}
                        <div className="p-8">
                            <div className="flex items-start justify-between mb-8">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <PlatformIcon platform={contest.platform} className="h-6 w-6" />
                                        <span className="text-[12px] font-bold uppercase tracking-widest text-[#A1A1AA]">{contest.platform}</span>
                                    </div>
                                    <h2 className="text-2xl font-display font-black text-white leading-tight pr-8">
                                        {contest.title}
                                    </h2>
                                </div>
                                <button onClick={onClose} className="h-10 w-10 rounded-full bg-[#1A1A1A] border border-[#27272A] text-[#A1A1AA] hover:text-white flex items-center justify-center transition-all absolute top-6 right-6 z-10">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-px bg-[#27272A] border border-[#27272A] rounded-xl overflow-hidden mb-10">
                                <div className="bg-[#111111] p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-2">Starts at</p>
                                    <p className="text-[15px] font-bold text-white leading-none">
                                        {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                    <p className="text-sm text-[#A1A1AA] mt-1.5">
                                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="bg-[#111111] p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-2">Duration</p>
                                    <div className="flex items-center gap-2">
                                        <Timer className="h-4 w-4 text-primary" />
                                        <p className="text-[15px] font-bold text-white">{contest.duration || "2h 00m"}</p>
                                    </div>
                                </div>
                                <div className="bg-[#111111] p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-2">Platform</p>
                                    <p className="text-[15px] font-bold text-white">{contest.platform}</p>
                                </div>
                                <div className="bg-[#111111] p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-2">Registration</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-tighter">Open</span>
                                </div>
                            </div>

                            {contest.link && (
                                <a 
                                    href={contest.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block w-full"
                                >
                                    <button className="w-full h-14 rounded-xl bg-white text-black font-black text-base flex items-center justify-center gap-3 hover:bg-[#FACC15] hover:text-black transition-all group">
                                        Navigate to {contest.platform} 
                                        <ExternalLink className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </button>
                                </a>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ContestModal;
