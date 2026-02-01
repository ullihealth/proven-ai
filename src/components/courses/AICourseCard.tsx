import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Course } from "@/lib/courses/types";
import { courseTypeLabels, lifecycleStateLabels } from "@/lib/courses/types";
import { AICardBackground } from "./AICardBackground";
import { computePriceTier, getPriceTierLabel } from "@/lib/courses/entitlements";

interface AICourseCardProps {
  course: Course;
  className?: string;
}

export const AICourseCard = ({ course, className }: AICourseCardProps) => {
  const {
    title,
    description,
    estimatedTime,
    courseType,
    lifecycleState,
    capabilityTags = [],
    lastUpdated,
    href,
    releaseDate,
    priceTier: coursePriceTier,
  } = course;

  // Limit tags to 6
  const displayTags = capabilityTags.slice(0, 6);
  
  // Compute price tier
  const priceTier = coursePriceTier || computePriceTier(releaseDate);
  const priceLabel = getPriceTierLabel(priceTier);
  const isIncluded = priceTier === "included";

  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col h-full",
        "rounded-xl overflow-hidden",
        "border border-[hsl(var(--ai-card-border)/0.4)]",
        "transition-all duration-300",
        "hover:border-[hsl(var(--ai-card-glow)/0.5)]",
        "hover:shadow-[0_0_30px_-5px_hsl(var(--ai-card-glow)/0.25)]",
        className
      )}
    >
      {/* Background with texture */}
      <AICardBackground />
      
      {/* Edge glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-[hsl(var(--ai-card-glow)/0.3)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-5">
        {/* Title */}
        <h3 className="text-base font-medium text-white group-hover:text-[hsl(var(--ai-card-glow))] transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Description - single line truncate */}
        <p className="mt-2 text-sm text-white/70 line-clamp-1">
          {description}
        </p>

        {/* Metadata row */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/50">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {estimatedTime}
          </span>
          <span className="text-white/30">•</span>
          <Badge 
            variant="outline" 
            className="text-xs px-2 py-0 font-normal border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
          >
            {courseTypeLabels[courseType]}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-xs px-2 py-0 font-normal border-white/20 bg-white/5 hover:bg-white/10",
              lifecycleState === 'current' && "border-[hsl(var(--ai-card-glow)/0.4)] text-[hsl(var(--ai-card-glow))] bg-[hsl(var(--ai-card-glow)/0.1)]",
              lifecycleState === 'reference' && "text-white/60",
              lifecycleState === 'legacy' && "text-white/40"
            )}
          >
            {lifecycleStateLabels[lifecycleState]}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-xs px-2 py-0 font-normal",
              isIncluded 
                ? "border-[hsl(var(--ai-card-glow)/0.4)] text-[hsl(var(--ai-card-glow))] bg-[hsl(var(--ai-card-glow)/0.1)]" 
                : "border-white/20 bg-white/5 text-white/70"
            )}
          >
            {priceLabel}
          </Badge>
        </div>

        {/* Capability tags */}
        {displayTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs px-2 py-0.5 font-normal border-white/10 bg-white/5 text-white/60"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer with last updated and arrow */}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="text-xs text-white/40">
            Updated {lastUpdated}
          </span>
          <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-[hsl(var(--ai-card-glow))] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
};
