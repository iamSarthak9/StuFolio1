import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const Logo: React.FC<LogoProps> = ({ className = "", showText = true, size = "md" }) => {
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-xl bg-primary flex items-center justify-center shadow-glow shrink-0 overflow-hidden`}>
        <img src="/logo.png" alt="StuFolio Logo" className="h-full w-full object-cover" />
      </div>
      {showText && (
        <span className={`font-display ${textClasses[size]} font-bold text-foreground tracking-tight`}>
          StuFolio
        </span>
      )}
    </Link>
  );
};

export default Logo;
