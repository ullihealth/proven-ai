import { TrustLevel, trustLevelInfo } from "@/data/directoryToolsData";
import { cn } from "@/lib/utils";
import { Star, CheckCircle, Circle, Archive, Shield } from "lucide-react";

interface TrustBadgeProps {
  level: TrustLevel;
  className?: string;
  showIcon?: boolean;
}

const trustIcons: Record<TrustLevel, React.ReactNode> = {
  core: <Star className="h-3 w-3" />,
  recommended: <CheckCircle className="h-3 w-3" />,
  reviewed: <Shield className="h-3 w-3" />,
  unreviewed: <Circle className="h-3 w-3" />,
  archived: <Archive className="h-3 w-3" />,
};

export const TrustBadge = ({ level, className, showIcon = true }: TrustBadgeProps) => {
  const info = trustLevelInfo[level];
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        info.color,
        level === 'archived' && "opacity-75",
        className
      )}
    >
      {showIcon && trustIcons[level]}
      {info.label}
    </span>
  );
};
