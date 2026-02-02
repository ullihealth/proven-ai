import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { VideoPlayer } from "./VideoPlayer";
import { DailyFlowPost, DayOfWeek, DAY_CONFIG, DailyFlowVisualSettings } from "@/lib/dailyflow";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface DailyFlowVideoPageProps {
  day: DayOfWeek;
  posts: DailyFlowPost[]; // Now accepts array of posts
  visualSettings?: DailyFlowVisualSettings;
}

// Individual post card component
const PostCard = ({ 
  post, 
  day,
  isGradientOrImage 
}: { 
  post: DailyFlowPost; 
  day: DayOfWeek;
  isGradientOrImage: boolean;
}) => {
  const config = DAY_CONFIG[day];
  
  return (
    <article className={cn(
      "rounded-lg overflow-hidden",
      isGradientOrImage ? "bg-white/5 border border-white/10" : "bg-card border border-border"
    )}>
      {/* Video Container */}
      <div className="w-full">
        <VideoPlayer videoUrl={post.videoUrl} />
      </div>
      
      {/* Content */}
      <div className="p-4 md:p-6 space-y-3">
        {/* Meta row: Badge + Date */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs",
              isGradientOrImage && "bg-white/10 text-white border-white/20"
            )}
          >
            {config.label}
          </Badge>
          {post.publishedAt && (
            <span className={cn(
              "text-xs",
              isGradientOrImage ? "text-white/60" : "text-muted-foreground"
            )}>
              {format(new Date(post.publishedAt), 'MMM d, yyyy')}
            </span>
          )}
        </div>
        
        {/* Title */}
        <h2 className={cn(
          "text-lg md:text-xl font-semibold leading-tight",
          isGradientOrImage ? "text-white" : "text-foreground"
        )}>
          {post.title}
        </h2>
        
        {/* Description */}
        <p className={cn(
          "text-sm md:text-base",
          isGradientOrImage ? "text-white/80" : "text-muted-foreground"
        )}>
          {post.description}
        </p>

        {/* Caption (optional) */}
        {post.caption && (
          <p className={cn(
            "text-sm italic pt-2 border-t",
            isGradientOrImage 
              ? "text-white/60 border-white/20" 
              : "text-muted-foreground border-border"
          )}>
            {post.caption}
          </p>
        )}
      </div>
    </article>
  );
};

export const DailyFlowVideoPage = ({ day, posts, visualSettings }: DailyFlowVideoPageProps) => {
  const config = DAY_CONFIG[day];
  
  // Build background style based on visual settings
  const getBackgroundStyle = (): React.CSSProperties => {
    if (!visualSettings) return {};
    
    switch (visualSettings.backgroundMode) {
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${visualSettings.gradientFrom || '#0f1729'}, ${visualSettings.gradientVia || '#1a2540'}, ${visualSettings.gradientTo || '#252f4a'})`,
        };
      case 'image':
        return visualSettings.backgroundImage
          ? { backgroundImage: `url(${visualSettings.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {};
      default:
        return {};
    }
  };
  
  const isGradientOrImage = visualSettings?.backgroundMode === 'gradient' || visualSettings?.backgroundMode === 'image';

  return (
    <AppLayout>
      <div 
        className={cn(
          "min-h-full -mx-4 -my-6 md:-mx-6 lg:-mx-8 px-4 py-6 md:px-6 lg:px-8",
          isGradientOrImage && "text-white"
        )}
        style={getBackgroundStyle()}
      >
        <PageHeader
          title={`${config.label} – ${config.theme}`}
          description={config.description}
          badge={config.label}
        />

        {posts.length > 0 ? (
          <div className="space-y-6 max-w-3xl mx-auto">
            {posts.map((post) => (
              <PostCard 
                key={post.id}
                post={post}
                day={day}
                isGradientOrImage={isGradientOrImage}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 max-w-md mx-auto">
            <div className={cn(
              "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
              isGradientOrImage ? "bg-white/10" : "bg-muted"
            )}>
              <config.icon className={cn(
                "w-8 h-8",
                isGradientOrImage ? "text-white/60" : "text-muted-foreground"
              )} />
            </div>
            <h3 className={cn(
              "text-lg font-medium mb-2",
              isGradientOrImage ? "text-white" : "text-foreground"
            )}>
              No video posted yet
            </h3>
            <p className={cn(
              "text-sm",
              isGradientOrImage ? "text-white/60" : "text-muted-foreground"
            )}>
              Check back soon for the latest {config.theme.toLowerCase()} content.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
