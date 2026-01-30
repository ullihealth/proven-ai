import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentItemProps {
  title: string;
  description: string;
  whoFor?: string;
  whyMatters?: string;
  lastUpdated?: string;
  href: string;
  variant?: "card" | "list";
}

export const ContentItem = ({
  title,
  description,
  whoFor,
  whyMatters,
  lastUpdated,
  href,
  variant = "list",
}: ContentItemProps) => {
  if (variant === "card") {
    return (
      <Link to={href} className="pai-card group block">
        <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm text-pai-text-secondary line-clamp-2">
          {description}
        </p>
        
        {(whoFor || whyMatters) && (
          <div className="mt-4 space-y-2">
            {whoFor && (
              <p className="text-xs text-pai-text-muted">
                <span className="font-medium">Who this is for:</span> {whoFor}
              </p>
            )}
            {whyMatters && (
              <p className="text-xs text-pai-text-muted">
                <span className="font-medium">Why it matters:</span> {whyMatters}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-pai-text-muted">
              <Clock className="h-3 w-3" />
              <span>Updated {lastUpdated}</span>
            </div>
          )}
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={href}
      className={cn(
        "pai-list-item group border-b border-pai-border-subtle last:border-0",
        "hover:bg-pai-surface-hover"
      )}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mt-1 text-sm text-pai-text-secondary line-clamp-2">
          {description}
        </p>
        
        {(whoFor || whyMatters) && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {whoFor && (
              <p className="text-xs text-pai-text-muted">
                <span className="font-medium">For:</span> {whoFor}
              </p>
            )}
            {whyMatters && (
              <p className="text-xs text-pai-text-muted">
                <span className="font-medium">Why:</span> {whyMatters}
              </p>
            )}
          </div>
        )}

        {lastUpdated && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-pai-text-muted">
            <Clock className="h-3 w-3" />
            <span>Updated {lastUpdated}</span>
          </div>
        )}
      </div>

      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
};
