import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Course } from "@/lib/courses/types";
import { courseTypeLabels, lifecycleStateLabels } from "@/lib/courses/types";
import { computePriceTier, getPriceTierLabel } from "@/lib/courses/entitlements";

interface CourseCardProps {
  course: Course;
  className?: string;
}

export const CourseCard = ({ course, className }: CourseCardProps) => {
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
  
  // Compute price tier from releaseDate if not set
  const priceTier = coursePriceTier || computePriceTier(releaseDate);
  const priceLabel = getPriceTierLabel(priceTier);
  const isIncluded = priceTier === "included";

  return (
    <Link
      to={href}
      className={cn(
        "group flex flex-col h-full",
        "bg-card rounded-lg border border-border",
        "p-5 transition-all duration-200",
        "hover:border-primary/20 hover:shadow-sm",
        className
      )}
    >
      {/* Title */}
      <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
        {title}
      </h3>

      {/* Description - single line truncate */}
      <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
        {description}
      </p>

      {/* Metadata row */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {estimatedTime}
        </span>
        <span className="text-border">•</span>
        <span>{courseTypeLabels[courseType]}</span>
        <span className="text-border">•</span>
        <span
          className={cn(
            lifecycleState === 'current' && "text-primary font-medium",
            lifecycleState === 'legacy' && "text-muted-foreground/70"
          )}
        >
          {lifecycleStateLabels[lifecycleState]}
        </span>
        <span className="text-border">•</span>
        <Badge 
          variant={isIncluded ? "secondary" : "outline"}
          className={cn(
            "text-xs px-2 py-0 font-normal",
            isIncluded 
              ? "bg-primary/10 text-primary border-primary/20" 
              : "bg-muted text-muted-foreground"
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
              variant="secondary"
              className="text-xs px-2 py-0.5 font-normal bg-muted text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer with last updated and arrow */}
      <div className="mt-auto pt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Updated {lastUpdated}
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
};
