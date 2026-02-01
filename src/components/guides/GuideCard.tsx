import { Link } from "react-router-dom";
import { Guide, lifecycleStateLabels, difficultyLabels } from "@/lib/guides/types";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuideCardProps {
  guide: Guide;
  variant?: 'cluster' | 'discovery';
  showThumbnail?: boolean;
}

export function GuideCard({ guide, variant = 'cluster', showThumbnail = false }: GuideCardProps) {
  const isLegacy = guide.lifecycleState === 'legacy';
  const isDiscovery = variant === 'discovery';
  
  return (
    <Link
      to={`/learn/guides/${guide.slug}`}
      className={cn(
        "block rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm",
        isLegacy && "opacity-60"
      )}
    >
      {/* Optional thumbnail for discovery mode */}
      {isDiscovery && showThumbnail && guide.thumbnailUrl && (
        <div className="mb-3 aspect-video w-full overflow-hidden rounded-md bg-muted">
          <img 
            src={guide.thumbnailUrl} 
            alt="" 
            className="h-full w-full object-cover"
          />
        </div>
      )}
      
      {/* Header with badges */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {difficultyLabels[guide.difficulty]}
        </Badge>
        
        {isDiscovery && guide.lifecycleState !== 'current' && (
          <Badge 
            variant={isLegacy ? "secondary" : "outline"} 
            className={cn("text-xs", isLegacy && "bg-muted")}
          >
            {lifecycleStateLabels[guide.lifecycleState]}
          </Badge>
        )}
      </div>
      
      {/* Title */}
      <h3 className="mb-2 font-semibold text-foreground line-clamp-2">
        {guide.title}
      </h3>
      
      {/* Description */}
      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
        {guide.description}
      </p>
      
      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {guide.whoFor}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {guide.lastUpdated}
        </span>
      </div>
      
      {/* Tags in discovery mode */}
      {isDiscovery && guide.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {guide.tags.slice(0, 3).map(tag => (
            <span 
              key={tag} 
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {guide.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{guide.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
