import React from "react";
import { 
    Code2, 
    Trophy, 
    Terminal, 
    Zap, 
    Activity, 
    Globe, 
    Layers,
    Coffee
} from "lucide-react";

interface PlatformIconProps {
    platform?: string;
    className?: string;
}

const PlatformIcon: React.FC<PlatformIconProps> = ({ platform, className = "h-4 w-4" }) => {
    const p = platform?.toLowerCase() || "";

    if (p.includes("leetcode")) {
        return <Terminal className={`${className} text-amber-500`} />;
    }
    if (p.includes("codeforces")) {
        return <Code2 className={`${className} text-blue-500`} />;
    }
    if (p.includes("codechef")) {
        return <Coffee className={`${className} text-orange-600`} />;
    }
    if (p.includes("atcoder")) {
        return <Zap className={`${className} text-purple-500`} />;
    }
    if (p.includes("google") || p.includes("kickstart")) {
        return <Globe className={`${className} text-blue-600`} />;
    }
    if (p.includes("hackerrank")) {
        return <Activity className={`${className} text-emerald-500`} />;
    }

    // Default icon for contests
    return <Trophy className={`${className} text-primary`} />;
};

export default PlatformIcon;
