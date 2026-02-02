import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { VideoPlayer } from "./VideoPlayer";
import { DailyFlowPost, DayOfWeek, DAY_CONFIG, DailyFlowVisualSettings } from "@/lib/dailyflow";
import { cn } from "@/lib/utils";

interface DailyFlowVideoPageProps {
  day: DayOfWeek;
  post: DailyFlowPost | null;
  visualSettings?: DailyFlowVisualSettings;
}

export const DailyFlowVideoPage = ({ day, post, visualSettings }: DailyFlowVideoPageProps) => {
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

        {post ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Video Container */}
            <VideoPlayer 
              videoUrl={post.videoUrl} 
              className="shadow-lg"
            />

            {/* Post Content */}
            <div className="space-y-3">
              <h2 className={cn(
                "text-xl md:text-2xl font-semibold",
                isGradientOrImage ? "text-white" : "text-foreground"
              )}>
                {post.title}
              </h2>
              
              <p className={cn(
                "text-base md:text-lg",
                isGradientOrImage ? "text-white/80" : "text-muted-foreground"
              )}>
                {post.description}
              </p>

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
